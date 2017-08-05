import axios from 'axios';
import querystring from 'querystring';
import dgram from 'dgram';
import URL from 'url';
import DNS from 'dns';

const API_NODES_CREATE = '/v1/nodes/create';
const API_NODES_LIST = '/v1/nodes/list';
const API_NODES_RENAME = '/v1/nodes/rename';
const API_NODES_DELETE = '/v1/nodes/delete';
const OTA_INTERNATIONAL_URL = 'https://us.wio.seeed.io';
const SERVER_LOGIN = 'https://wio.seeed.io/login';

const AP_IP = '192.168.4.1';
const AP_PORT = 1025;

const udpWrite = (dataStr, address, port, timeout) => new Promise((resolve, reject) => {
  const client = dgram.createSocket('udp4');
  let to = 0;
  client.on('listening', () => {
    setTimeout(() => {
      const data = new Buffer(dataStr, 'ascii');
      client.send(data, 0, data.length, port, address);
      to = setTimeout(() => {
        client.close();
        reject('Connection timeout');
      }, timeout || 5000);
    }, 1000);
  });
  client.on('message', (message) => {
    clearTimeout(to);
    client.close();
    resolve(message);
  });
  client.bind(1025, '0.0.0.0');
});

export default class WioSetup {
  login(parameters) {
    this.params = parameters;
    if (!this.params.user.server) this.params.user.server = OTA_INTERNATIONAL_URL;
    const url = URL.parse(this.params.user.server);
    this.params.user.hostname = url.hostname;
    return new Promise((resolve, reject) => {
      DNS.lookup(this.params.user.hostname, { family: 4 }, (err, addresses) => {
        if (err) {
          reject(err);
          return;
        }
        this.params.user.hostaddress = addresses;
        resolve();
      });
    })
    .then(() => {
      const body = {
        email: this.params.user.email,
        password: this.params.user.password,
      };
      return axios.post(`${SERVER_LOGIN}`, querystring.stringify(body))
      .then((result) => {
        const re = /^token: ([^ ]+)$/;
        const response = (result.data.split(/\n/).filter(l => re.test(l)).map(l => l.replace(re, '$1')));
        if (response.length === 1) {
          this.params.user.token = response[0];
          return result.data;
        }
        return Promise.reject('login failed');
      });
    });
  }

  createNode() {
    const instance = axios.create({
      baseURL: this.params.user.server,
      headers: {
        Authorization: this.params.user.token,
      },
    });
    const body = {
      name: 'node000',
      board: 'Wio Node v1.0',
    };
    return instance.post(API_NODES_CREATE, querystring.stringify(body))
    .then((result) => {
      this.params.node.sn = result.data.node_sn;
      this.params.node.key = result.data.node_key;
      return result.data;
    });
  }

  nodesList() {
    const instance = axios.create({
      baseURL: this.params.user.server,
      headers: {
        Authorization: this.params.user.token,
      },
    });
    return instance.get(API_NODES_LIST)
    .then(result => result.data);
  }

  rename(params) {
    const instance = axios.create({
      baseURL: this.params.user.server,
      headers: {
        Authorization: this.params.user.token,
      },
    });
    const body = {
      name: params.node.name,
      node_sn: params.node.sn,
    };
    return instance.post(API_NODES_RENAME, querystring.stringify(body))
    .then((result) => {
      this.params.node = params.node;
      return result.data;
    });
  }

  delete(params) {
    const instance = axios.create({
      baseURL: this.params.user.server,
      headers: {
        Authorization: this.params.user.token,
      },
    });
    const body = {
      node_sn: params.delete,
    };
    return instance.post(API_NODES_DELETE, querystring.stringify(body))
      .then((result) => {
        this.params.node = params.node;
        return result.data;
      });
  }

  updateWifiSetting(params) {
    return udpWrite('VERSION', AP_IP, AP_PORT, 5000)
    .then((message) => {
      const version = parseFloat(message.toString());
      if (isNaN(version)) {
        Promise.reject('Failed to get VERSION.');
        return null;
      }
      const domain = version <= 1.1 ? this.params.user.hostaddress : this.params.user.hostname;
      const cmd = `APCFG: ${params.wifi.ssid}\t${params.wifi.password}\t${this.params.node.key}\t${this.params.node.sn}\t${domain}\t${domain}\t`;
      return udpWrite(cmd, AP_IP, AP_PORT, 5000);
    })
    .then((message) => {
      const result = message.toString();
      if (result.substr(0, 2) !== 'ok') {
        Promise.reject('Failed to write APCFG.');
        return;
      }
      Promise.resolve();
    });
  }
}

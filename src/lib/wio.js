import sha1 from 'sha1';
import axios from 'axios';
import querystring from 'querystring';
import dgram from 'dgram';

const API_NODES_CREATE = '/v1/nodes/create';
const API_NODES_LIST = '/v1/nodes/list';
const API_NODES_RENAME = '/v1/nodes/rename';
const HINGE_USER_LOGIN = 'r=common/user/login';
const WIOLINK_APPID = 'wiolink';
const WIOLINK_APPKEY = 'MPP=tGjz</p5';
const WIOLINK_COMMON = 'seeed_wiolink';
const WIOLINK_SOURCE = 4;
const SERVER_OUT_PREFIX = 'http://bazaar.seeed.cc/api/index.php?';
const OTA_INTERNATIONAL_URL = 'https://us.wio.seeed.io';

const AP_IP = '192.168.4.1';

function getSign(uri, timestamp) {
  return new Promise((resolve) => {
    const list = [];
    list.push(WIOLINK_APPID);
    list.push(WIOLINK_APPKEY);
    list.push(WIOLINK_COMMON);
    list.push(uri);
    list.push(timestamp);

    return resolve(sha1(list.sort().join('')));
  });
}

export default class WioSetup {
  login(parameters) {
    this.params = parameters;
    const timestamp = `${parseInt(Date.now() / 1000, 10)}`;
    return getSign(HINGE_USER_LOGIN, timestamp)     // create signature
    .then((sign) => {
      const body = {
        email: this.params.user.email,
        password: this.params.user.password,
        timestamp,
        sign,
        source: WIOLINK_SOURCE,
        api_key: WIOLINK_APPID,
      };
      return axios.post(`${SERVER_OUT_PREFIX}${HINGE_USER_LOGIN}`, querystring.stringify(body))
      .then((result) => {
        if (result.data.data) {
          this.params.user.token = result.data.data.token;
          return result.data;
        }
        return Promise.reject('login failed');
      });
    });
  }

  createNode() {
    const instance = axios.create({
      baseURL: OTA_INTERNATIONAL_URL,
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
      baseURL: OTA_INTERNATIONAL_URL,
      headers: {
        Authorization: this.params.user.token,
      },
    });
    return instance.get(API_NODES_LIST)
    .then(result => result.data);
  }

  rename(params) {
    const instance = axios.create({
      baseURL: OTA_INTERNATIONAL_URL,
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

  updateWifiSetting(params) {
    return new Promise((resolve, reject) => {
      const cmd = `APCFG: ${params.wifi.ssid}\t${params.wifi.password}\t${this.params.node.key}\t${this.params.node.sn}\t${OTA_INTERNATIONAL_URL.replace(/^[^:]+:\/+/, '')}\t${OTA_INTERNATIONAL_URL.replace(/^[^:]+:\/+/, '')}\t`;
      const client = dgram.createSocket('udp4');
      const timeout = setTimeout(() => {
        client.close();
        reject('Connection timeout');
      }, 5000);
      client.on('listening', () => {
        setTimeout(() => {
          client.send(new Buffer(cmd), 0, cmd.length, 1025, AP_IP);
        }, 500);
      });
      client.on('message', (message) => {
        clearTimeout(timeout);
        if (message.toString().substr(0, 2) === 'ok') {
          client.close();
          resolve(message);
          return;
        }
        client.close();
        reject(message.toString());
      });
      client.bind(1025, '0.0.0.0');
    });
  }
}

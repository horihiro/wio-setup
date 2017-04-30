import dgram from 'dgram';
import prompt from 'prompt-promise';

import Const from './lib/const';
import wifiName from '../../wifi-name';
import Wio from './lib/wio';
import loop from './lib/promise-loop';

const parameters = {
  user: {
    email: '',
    password: '',
    token: '',
  },
  wifi: {
    ssid: '',
    password: '',
  },
  node: {
    key: '',
    sn: '',
    name: '',
  },
};

const wio = new Wio();
let timeout = null;
prompt('email: ')
.then((email) => {
  parameters.user.email = email;
  return prompt.password('password: ');
})
.then((password) => {
  parameters.user.password = password;
  process.stdout.write('logging in ');
  timeout = setInterval(() => {
    process.stdout.write('.');
  }, 1000);
  return wio.login(parameters);
})
.then((result) => {
  clearInterval(timeout);
  if (!result.data) return Promise.reject('login failed.');
  process.stdout.write(' done.\n');
  process.stdout.write('creating a node ');
  timeout = setInterval(() => {
    process.stdout.write('.');
  }, 1000);
  return wio.createNode();
})
.then((result) => {
  clearInterval(timeout);
  process.stdout.write(' done.\n');
  parameters.node.sn = result.node_sn;
  parameters.node.key = result.node_key;
  return prompt('ssid: ');
})
.then((ssid) => {
  parameters.wifi.ssid = ssid;
  return prompt.password(`password for ssid '${parameters.wifi.ssid}': `);
})
.then((wifiPwd) => {
  parameters.wifi.password = wifiPwd;
  return loop(
    Promise.resolve(),
    () => {
      process.stdout.write('.');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ done: false });
        }, 1000);
      });
    },
  );
})
.then(() => {
  process.stdout.write('sending wifi-config to the node...\n');
  const cmd = `APCFG: ${parameters.wifi.ssid}\t${parameters.wifi.password}\t${parameters.node.key}\t${parameters.node.sn}\t${Const.OTA_INTERNATIONAL_URL.replace(/^[^:]+:\/+/, '')}\t${Const.OTA_INTERNATIONAL_URL.replace(/^[^:]+:\/+/, '')}\t`;
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    timeout = setTimeout(() => {
      client.close();
      reject();
    }, 5000);
    client.on('listening', () => {
      client.send(new Buffer(cmd), 0, cmd.length, 1025, Const.AP_IP);
    });
    client.on('message', (message) => {
      clearTimeout(timeout);
      if (message.toString().substr(0, 2) === 'ok') {
        process.stdout.write(' -> succeeded.\n');
        client.close();
        resolve(message);
        return;
      }
      client.close();
      reject();
    });
    client.bind(1025, '0.0.0.0');
  });
})
.then(() => prompt('Connect to Internet, then Press any key.'))
.then(() => {
  process.stdout.write('getting nodes list...\n');
  return nodesList(parameters);
})
.then((result) => {
  process.stdout.write(' -> succeeded.');
  const nodeList = result.data.nodes.filter(
    node => (node.node_key === parameters.node.key && node.node_sn === parameters.node.sn)
  );
  if (nodeList.length === 1) return nodeList[0];
  return Promise.reject();
})
.then(() => prompt('node-name: '))
.then((name) => {
  parameters.node.name = name;
  return wio.rename(parameters);
})
.then(() => {
  process.stdout.write(' -> done.\n');
  process.exit(0);
})
.catch((err) => {
  process.stderr.write(`${err}\n`);
  process.exit(1);
});

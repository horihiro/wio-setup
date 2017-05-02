#!/usr/bin/env node

import program from 'commander';
import WioSetup from '..';
import prompt from 'prompt-promise';
import Wifi from '../lib/wifi';
import loop from '../lib/promise-loop';

const spin = [
  '\\',
  '|',
  '/',
  '-',
];

let spinTimeout = null;
const startSpin = () => {
  let pos = 0;
  spinTimeout = setInterval(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`${spin[pos]}`);
    pos = pos === spin.length - 1 ? 0 : pos + 1;
  }, 100);
};
const stopSpin = () => {
  clearInterval(spinTimeout);
  spinTimeout = null;
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
};

function main() {

  program.version(require('../package.json').version)
    .option('-e, --email [value]', 'email address')
    .option('-p, --password [value]', 'password')
    .option('-s, --wifiSsid [value]', 'wifi ssid')
    .option('-P, --wifiPwd [value]', 'wifi password')
    .option('-n, --wioName [value]', 'wio-node name')
    .option('-a, --wioSsid [value]', 'wio-node ssid')
    .option('-l, --list', 'listing mode')
    .parse(process.argv);

  const params = {
    user: {
      email: program.email,
      password: program.password,
      token: '',
    },
    wifi: {
      ssid: program.wifiSsid,
      password: program.wifiPwd,
    },
    node: {
      key: '',
      sn: '',
      name: program.wioName,
      ssid: ''
    },
  };
  const wioSetup = new WioSetup();
  
  return Promise.resolve()
  .then(() => {
    if (!params.user.email) {
      return prompt('email: ')
      .then((email) => {
        params.user.email = email;
        return Promise.resolve();
      })
    }
    return Promise.resolve();
  })
  .then(() => {
    if (!params.user.password) {
      return prompt.password('password: ')
      .then((password) => {
        params.user.password = password;
        return Promise.resolve();
      })
    }
    return Promise.resolve();
  })
  .then(() => {
    if (program.list) {
      startSpin();
      return wioSetup.list(params)
      .then((nodeList) => {
        stopSpin();
        const separator = '----';
        process.stdout.write(`${separator}\n`);
        process.stdout.write(nodeList.nodes.map(node => `  name: ${node.name}
  online: ${node.online}
  node_key: ${node.node_key}
  node_sn: ${node.node_sn}`,
        ).join(`\n${separator}\n`));
        process.stdout.write(`\n${separator}\n`);
        process.exit(1);
      })
    }
    return Promise.resolve();
  })
  .then(() => {
    if (!params.wifi.ssid) {
      return prompt('wifi ssid: ')
      .then((ssid) => {
        params.wifi.ssid = ssid;
        return Promise.resolve();
      })
    }
    return Promise.resolve();
  })
  .then(() => {
    if (!params.wifi.password) {
      return prompt.password(`wifi password for '${params.wifi.ssid}': `)
      .then((password) => {
        params.wifi.password = password;
        return Promise.resolve();
      })
    }
    return Promise.resolve();
  })
  .then(() => {
    if (!params.node.name) {
      return prompt('wio-node name: ')
      .then((name) => {
        params.node.name = name;
        return Promise.resolve();
      })
    }
    return Promise.resolve();
  })
  .then(() => {
    startSpin();
    params.onComfirm = () => {
      stopSpin();
      process.stdout.write('\n');
      process.stdout.write('                          　    ／＼\n');
      process.stdout.write('                              ／　／＼\n');
      process.stdout.write('hold down this button      => |　＼／|\n');
      process.stdout.write(' until blue-light breathes    ＼　　／\n');
      process.stdout.write('                              　＼／\n');
      process.stdout.write('                           　    ┃\n');
      process.stdout.write('\n');
      process.stdout.write('connect to Wio-Node AP, \'Wio_XXXXXX\'\n');
      return prompt('press enter: ')
      .then(() => {
        process.stdout.write('checking SSID your machine connected...\n');
        startSpin();
        return loop(
          Promise.resolve(),
          () => {
            return new Promise((resolve) => {
              setTimeout(() => {
                return Wifi.getCurrentSsid()
                .then((ssid) => {
                  if (!ssid || !/^Wio_/.test(ssid)) return resolve({ done: false });

                  stopSpin();
                  return prompt(`now connected to SSID '${ssid}', ok? [Y/n]`)
                  .then((key) => {
                    if (key === '' || key === 'Y' || key === 'y') return resolve({ done: true });
                    process.stdout.moveCursor(0, -1);
                    process.stdout.clearLine();
                    startSpin();
                    resolve({ done: false });
                  })
                  ;
                });
              }, 5000);
            });
          }
        );
      });
    };
    return wioSetup.setup(params);
  })
  .then(() => {
    process.stdout.write(`access_token for '${params.node.name}' is '${params.node.key}'.\n`);
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(`${err}\n`)
    process.exit(1);
  })
}
main();

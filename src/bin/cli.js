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
  if (spinTimeout) clearInterval(spinTimeout);
  spinTimeout = null;
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
};

function main() {

  program.version(require('../package.json').version)
    .option('-e, --email [value]', 'email address')
    .option('-p, --password [value]', 'password')
    .option('-S, --server [value]', 'server to login')
    .option('-s, --wifiSsid [value]', 'wifi ssid')
    .option('-P, --wifiPwd [value]', 'wifi password')
    .option('-n, --wioName [value]', 'wio-node name')
    .option('-l, --list', 'list your wio-node')
    .option('-d, --delete [sn of wionode]', 'delete wio-node specified by SN')
    .parse(process.argv);

  const params = {
    user: {
      email: program.email,
      password: program.password,
      server: program.server,
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
      .then((nodes) => {
        stopSpin();
        if (nodes.length === 0) {
          process.stdout.write(`no wionode.\n`);
          process.exit(1);
        }
        const headers = ['name', 'sn', 'status', 'access_token'];
        const widths = [4, 32, 7, 32];
        nodes.forEach((node) => {
          if (widths[0] < node.name.length) {
            widths[0] = node.name.length;
          }
          if (widths[1] < node.node_sn.length) {
            widths[1] = node.node_sn.length;
          }
        });
        let gaps = [0, 0];
        gaps[0] = widths[0] - 2;
        gaps[1] = widths[1] - 2;
        process.stdout.write(`${headers[0]}${Array(gaps[0]).fill(' ').join('')}${headers[1]}${Array(gaps[1]).fill(' ').join('')}  ${headers[2]}   ${headers[3]}\n`);
        process.stdout.write(`${Array(widths[0] + widths[1] + widths[2] + widths[3] + 6).fill('-').join('')}\n`);
        nodes.forEach((node) => {
          gaps[0] = widths[0] - node.name.length + 2;
          process.stdout.write(`${node.name}${Array(gaps[0]).fill(' ').join('')}`);
          gaps[1] = widths[1] - node.node_sn.length + 2;
          process.stdout.write(`${node.node_sn}${Array(gaps[1]).fill(' ').join('')}`);
          process.stdout.write(`${node.online ? 'online   ' : 'offline  '}`);
          process.stdout.write(`${node.node_key}\n`);
        });
        process.exit(0);
      })
    } else if (program.delete) {
      startSpin();
      params.node.sn = program.delete;
      return wioSetup.delete(params)
        .then(() => {
          stopSpin();
          process.stdout.write(`'${params.node.sn}' is deleted.\n`);
          process.exit(0);
        })
        .catch((err) => {
          stopSpin();
          process.stderr.write(`${err.response.data.error}\n`);
          process.exit(1);
        });
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
  .then(() =>{
    startSpin();
    return wioSetup.list(params)
    .then((nodes) => {
      stopSpin();
      if (nodes.length === 0) return Promise.resolve({});
      nodes.forEach((node, index) => {
        process.stdout.write(`[${index+1}] ${node.name}\n`);
      });
      process.stdout.write('[0] creating new one\n\n');
      return loop(
        Promise.resolve(),
        () => {
          return prompt(`select [0-${nodes.length}]: `)
          .then((key) => {
            const index = parseInt(key);
            if (isNaN(index) || index > nodes.length || index < 0) {
              process.stdout.moveCursor(0, -1);
              process.stdout.clearLine();
              return Promise.resolve({ done: false });
            }
            const value = index === 0 ? {} : { sn: nodes[index - 1].node_sn, key: nodes[index - 1].node_key, name: nodes[index - 1].name };
            return Promise.resolve({ done: true, value});
          });
        }
      );
    });
  })
  .then((node) => {
    params.node.sn = node.sn;
    params.node.key = node.key;
    params.node.name = params.node.name || node.name;
    if (!params.node.name) {
      const message = `wio-node name${node.name ? ' [' + node.name + ']' : ''}` + ': ';
      return loop(
        Promise.resolve(),
        () => {
          return prompt(message)
          .then((name) => {
            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine();
            params.node.name = name !== '' ? name : params.node.name;
            return Promise.resolve({ done: params.node.name && params.node.name !== ''});
          })
        }
      );
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
      process.stdout.write('connect to Wio-Node AP, \'Wio_XXXXXX\' or \'WioLink_XXXXXX\'\n\n');
      process.stdout.write('checking SSID your machine connected...\n');
      startSpin();
      return loop(
        Promise.resolve(),
        () => {
          return new Promise((resolve) => {
            setTimeout(() => {
              return Wifi.getCurrentSsid()
              .then((ssid) => {
                if (!ssid || !/^Wio(Link)?_/.test(ssid)) return resolve({ done: false });

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
    };
    return wioSetup.setup(params);
  })
  .then(() => {
    stopSpin();
    process.stdout.write(`access_token for '${params.node.name}' is '${params.node.key}'.\n`);
    process.exit(0);
  })
  .catch((err) => {
    stopSpin();
    process.stderr.write(`${err}\n`)
    process.exit(1);
  })
}
main();

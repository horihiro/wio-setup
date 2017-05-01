import prompt from 'prompt-promise';

import Wio from './lib/wio';
import loop from './lib/promise-loop';

const wio = new Wio();

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
}
const stopSpin = () => {
  clearInterval(spinTimeout);
  spinTimeout = null;
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
}

export default class WioSetup {
  constructor() {
    this.timeout = null;
  }

  setup(parameters) {
    const params = {
      user: {},
      wifi: {},
      node: {},
    };
    return (parameters.user.email ? Promise.resolve(parameters.user.email) : prompt('email: '))
      .then((email) => { params.user.email = email; })
      .then(() => (parameters.user.password ? Promise.resolve(parameters.user.password) : prompt.password('password: '))
      .then((password) => { params.user.password = password; }))
      .then(() => (parameters.wifi.ssid ? Promise.resolve(parameters.wifi.ssid) : prompt('wifi ssid: '))
      .then((ssid) => { params.wifi.ssid = ssid; }))
      .then(() => (parameters.wifi.password ? Promise.resolve(parameters.wifi.password) : prompt.password(`wifi password for '${params.wifi.ssid}': `))
      .then((password) => { params.wifi.password = password; }))
      .then(() => (parameters.node.name ? Promise.resolve(parameters.node.name) : prompt('wio-node name: '))
      .then((name) => { params.node.name = name; }))
      .then(() => (parameters.node.ap ? Promise.resolve(parameters.node.ap) : Promise.resolve(''))
      .then((ap) => { params.node.ap = ap; }))
      .then(() => {
        startSpin();
        return wio.login(params);
      })
      .then(() => {
        stopSpin();
        process.stdout.write('                          　    ／＼\n');
        process.stdout.write('                              ／　／＼\n');
        process.stdout.write('hold down this button      => |　＼／|\n');
        process.stdout.write(' until blue-light breathes    ＼　　／\n');
        process.stdout.write('                              　＼／\n');
        process.stdout.write('                           　    ┃\n');
        process.stdout.write('\n');
        process.stdout.write('scanning APs ...\n');
        return loop(
          Promise.resolve(),
          () => new Promise((resolve) => {
            startSpin();
            setTimeout(() => {
              resolve(['WIO_HOGE', 'WIO_FUGA']);
            }, 5000);
          })
          .then((aps) => {
            stopSpin();
            if (!aps || aps.length === 0) return {answer: false, aps};
            process.stdout.write(`${aps.map((ap, pos) => `[${pos}]: ${ap}`).join('\n')}\n`);
            return prompt('select AP from above or [r] to re-scan :')
            .then((answer) => {
              return {answer: answer, aps};
            });;
          })
          .then((result) => {
            if (!result.answer) {
              return { done: false };
            } else if (result.answer === 'r') {
              result.aps.forEach((ap) => {
                process.stdout.moveCursor(0, -1);
                process.stdout.clearLine();
              });
              process.stdout.moveCursor(0, -1);
              return { done: false };
            }
            return { done: true };
          }),
        );
      })
//      .then(() => wio.createNode())
//      .then(() => wio.rename(params))
//      .then(() => /* connect to selected WioNode AP */ )
//      .then(() => /* send config to WioNode */ )
      .then(() => {
        process.stdout.write('done.\n');
      });
  }

  list(parameters) {
    const params = {
      user: {},
    };
    return (parameters.user.email ? Promise.resolve(parameters.user.email) : prompt('email: '))
      .then((email) => { params.user.email = email; })
      .then(() => (parameters.user.password ? Promise.resolve(parameters.user.password) : prompt.password('password: '))
      .then((password) => { params.user.password = password; }))
      .then(() => {
        let pos = 0;
        this.timeout = setInterval(() => {
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(`${spin[pos]}`);
          pos += 1;
          if (pos >= spin.length) pos = 0;
        }, 100);
        return wio.login(params);
      })
      .then(() => wio.nodesList())
      .then((result) => {
        clearInterval(this.timeout);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        const separator = '----';
        process.stdout.write(`${separator}\n`);
        process.stdout.write(result.nodes.map(node => `  name: ${node.name}
  online: ${node.online}
  node_key: ${node.node_key}
  node_sn: ${node.node_sn}`,
        ).join(`\n${separator}\n`));
        process.stdout.write(`\n${separator}\n`);
      });
  }
}
/*
function(parameters) {

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
    process.stdout.write('\n -> succeeded.\n');
    process.stdout.write('creating a node ');
    timeout = setInterval(() => {
      process.stdout.write('.');
    }, 1000);
    return wio.createNode();
  })
  .then((result) => {
    clearInterval(timeout);
    process.stdout.write('\n -> succeeded.\n');
    parameters.node.sn = result.node_sn;
    parameters.node.key = result.node_key;
    return prompt('node-name: ');
  })
  .then((name) => {
    parameters.node.name = name;
    return wio.rename(parameters);
  })
  .then((result) => {
    return prompt('ssid: ');
  })
  .then((ssid) => {
    parameters.wifi.ssid = ssid;
    return prompt.password(`password for ssid '${parameters.wifi.ssid}': `);
  })
  .then((wifiPwd) => {
    parameters.wifi.password = wifiPwd;
    return prompt('Connect to Wio Node, then Press any key.');
  })
  .then((wifiPwd) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        wio.updateWifiSetting(parameters)
        .then((result) => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        })
      }, 5000);
    });
  })
  .then(() => {
    process.stdout.write(' -> done.\n');
    process.exit(0);
  })
  .catch((err) => {
    process.stderr.write(`${err}\n`);
    process.exit(1);
  });
};

*/

import {exec} from 'child_process';

const re_ssid = /^SSID\W*:\W*/;
const cmd_darwin = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I';
const cmd_win32 = 'netsh.exe wlan show interfaces';

const execNetSh = () => {
  return new Promise((resolve, reject) => {
    exec(cmd_win32, (err, stdout, stdin) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(stdout.split(/\n/).filter(l => re_ssid.test(l.trim())).map(l => l.trim().replace(re_ssid, ''))[0]);
    });
  });
};

export default class Wifi {
  static getCurrentSsid() {
    return new Promise((resolve) => {
      switch(process.platform) {
        case 'darwin':
          exec(cmd_darwin, (err, stdout) => {
            if (err) {
              reject(err);
              return;
            }
            const ssid = stdout.split(/\n/).filter(l => re_ssid.test(l.trim())).map(l => l.trim().replace(re_ssid, ''))[0];
            resolve(ssid);
          });
          break;
        case 'win32':
          execNetSh()
          .then((ssid) => {
            resolve(ssid);
          })
          .catch(() => {
            resolve('');
          });
          break;
        case 'linux':
          exec('cat /proc/version | grep Microsft | wc -l', (err, stdout, stderr) => {
            if (err) {
              reject(err);
              return;
            }
            if (parseInt(stdout) === 0) {
              execNetSh()
              .then((ssid) => {
                resolve(ssid);
              })
              .catch(() => {
                resolve('');
              });
              return;
            }
            // Pure Linux
            resolve('');
          });
          break;
      }
    });
  }
}

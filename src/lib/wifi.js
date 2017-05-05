import { exec } from 'child_process';

const reSsid = /^SSID\W*:\W*/;
const cmdDarwin = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I';
const cmdWin32 = 'netsh.exe wlan show interfaces';

const execNetSh = function execNetSh() {
  return new Promise((resolve, reject) => {
    exec(cmdWin32, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
        return;
      }
      resolve(stdout.split(/\n/).filter(l => reSsid.test(l.trim())).map(l => l.trim().replace(reSsid, ''))[0]);
    });
  });
};

export default class Wifi {
  static getCurrentSsid() {
    return new Promise((resolve, reject) => {
      switch (process.platform) {
        case 'darwin':
          exec(cmdDarwin, (err, stdout) => {
            if (err) {
              reject(err);
              return;
            }
            const ssid = stdout.split(/\n/).filter(l => reSsid.test(l.trim())).map(l => l.trim().replace(reSsid, ''))[0];
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
              reject(stderr);
              return;
            }
            if (parseInt(stdout, 10) === 0) {
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
        default:
          reject('unknown platform');
      }
    });
  }
}

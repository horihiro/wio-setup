import {exec} from 'child_process';

export default class Wifi {
  static getCurrentSsid() {
    return new Promise((resolve, reject) => {
      switch(process.platform) {
        case 'darwin':
          exec('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I', (err, stdout, stderr) => {
            if (err) {
              reject(err);
              return;
            }
            const ssid = stdout.split(/\n/).filter(l => /^[ ]*SSID/.test(l)).map((l => l.replace(/^[ ]*SSID: /, '')))[0];
            resolve(ssid);
          });
          break;
        case 'win32':
          break;
        case 'linux':
          break;
      }
    });
  }
}

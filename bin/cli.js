#!/usr/bin/env node

const WioSetup = require('../dist/index.js').default;
const program = require('commander');

program.version(require('../package.json').version)
  .option('-e, --email [value]', 'email address')
  .option('-p, --password [value]', 'password')
  .option('-s, --wifiSsid [value]', 'wifi ssid')
  .option('-P, --wifiPwd [value]', 'wifi password')
  .option('-n, --wioName [value]', 'wio-node name')
  .option('-a, --wioSsid [value]', 'wio-node ssid')
  .option('-l, --list', 'listing mode')
  .parse(process.argv);

const parameters = {
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
    name: program.nodeName,
    ssid: ''
  },
};
wioSetup = new WioSetup();

(program.list
  ? wioSetup.list(parameters)
  : wioSetup.setup(parameters)
)
.then((result) => {
  process.exit(0);
})
.catch((err) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stderr.write(`${err}\n`);
  process.exit(1);
});

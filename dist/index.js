'use strict';

var _dgram = require('dgram');

var _dgram2 = _interopRequireDefault(_dgram);

var _promptPromise = require('prompt-promise');

var _promptPromise2 = _interopRequireDefault(_promptPromise);

var _const = require('./lib/const');

var _const2 = _interopRequireDefault(_const);

var _wifiName = require('../../wifi-name');

var _wifiName2 = _interopRequireDefault(_wifiName);

var _wio = require('./lib/wio');

var _wio2 = _interopRequireDefault(_wio);

var _promiseLoop = require('./lib/promise-loop');

var _promiseLoop2 = _interopRequireDefault(_promiseLoop);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var parameters = {
  user: {
    email: '',
    password: '',
    token: ''
  },
  wifi: {
    ssid: '',
    password: ''
  },
  node: {
    key: '',
    sn: '',
    name: ''
  }
};

var wio = new _wio2.default();
var timeout = null;
(0, _promptPromise2.default)('email: ').then(function (email) {
  parameters.user.email = email;
  return _promptPromise2.default.password('password: ');
}).then(function (password) {
  parameters.user.password = password;
  process.stdout.write('logging in ');
  timeout = setInterval(function () {
    process.stdout.write('.');
  }, 1000);
  return wio.login(parameters);
}).then(function (result) {
  clearInterval(timeout);
  if (!result.data) return Promise.reject('login failed.');
  process.stdout.write(' done.\n');
  process.stdout.write('creating a node ');
  timeout = setInterval(function () {
    process.stdout.write('.');
  }, 1000);
  return wio.createNode();
}).then(function (result) {
  clearInterval(timeout);
  process.stdout.write(' done.\n');
  parameters.node.sn = result.node_sn;
  parameters.node.key = result.node_key;
  return (0, _promptPromise2.default)('ssid: ');
}).then(function (ssid) {
  parameters.wifi.ssid = ssid;
  return _promptPromise2.default.password('password for ssid \'' + parameters.wifi.ssid + '\': ');
}).then(function (wifiPwd) {
  parameters.wifi.password = wifiPwd;
  return (0, _promiseLoop2.default)(Promise.resolve(), function () {
    process.stdout.write('.');
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({ done: false });
      }, 1000);
    });
  });
}).then(function () {
  process.stdout.write('sending wifi-config to the node...\n');
  var cmd = 'APCFG: ' + parameters.wifi.ssid + '\t' + parameters.wifi.password + '\t' + parameters.node.key + '\t' + parameters.node.sn + '\t' + _const2.default.OTA_INTERNATIONAL_URL.replace(/^[^:]+:\/+/, '') + '\t' + _const2.default.OTA_INTERNATIONAL_URL.replace(/^[^:]+:\/+/, '') + '\t';
  return new Promise(function (resolve, reject) {
    var client = _dgram2.default.createSocket('udp4');
    timeout = setTimeout(function () {
      client.close();
      reject();
    }, 5000);
    client.on('listening', function () {
      client.send(new Buffer(cmd), 0, cmd.length, 1025, _const2.default.AP_IP);
    });
    client.on('message', function (message) {
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
}).then(function () {
  return (0, _promptPromise2.default)('Connect to Internet, then Press any key.');
}).then(function () {
  process.stdout.write('getting nodes list...\n');
  return nodesList(parameters);
}).then(function (result) {
  process.stdout.write(' -> succeeded.');
  var nodeList = result.data.nodes.filter(function (node) {
    return node.node_key === parameters.node.key && node.node_sn === parameters.node.sn;
  });
  if (nodeList.length === 1) return nodeList[0];
  return Promise.reject();
}).then(function () {
  return (0, _promptPromise2.default)('node-name: ');
}).then(function (name) {
  parameters.node.name = name;
  return wio.rename(parameters);
}).then(function () {
  process.stdout.write(' -> done.\n');
  process.exit(0);
}).catch(function (err) {
  process.stderr.write(err + '\n');
  process.exit(1);
});
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _promptPromise = require('prompt-promise');

var _promptPromise2 = _interopRequireDefault(_promptPromise);

var _wio = require('./lib/wio');

var _wio2 = _interopRequireDefault(_wio);

var _promiseLoop = require('./lib/promise-loop');

var _promiseLoop2 = _interopRequireDefault(_promiseLoop);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var wio = new _wio2.default();

var spin = ['\\', '|', '/', '-'];

var spinTimeout = null;
var startSpin = function startSpin() {
  var pos = 0;
  spinTimeout = setInterval(function () {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('' + spin[pos]);
    pos = pos === spin.length - 1 ? 0 : pos + 1;
  }, 100);
};
var stopSpin = function stopSpin() {
  clearInterval(spinTimeout);
  spinTimeout = null;
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
};

var WioSetup = function () {
  function WioSetup() {
    _classCallCheck(this, WioSetup);

    this.timeout = null;
  }

  _createClass(WioSetup, [{
    key: 'setup',
    value: function setup(parameters) {
      var params = {
        user: {},
        wifi: {},
        node: {}
      };
      return (parameters.user.email ? Promise.resolve(parameters.user.email) : (0, _promptPromise2.default)('email: ')).then(function (email) {
        params.user.email = email;
      }).then(function () {
        return (parameters.user.password ? Promise.resolve(parameters.user.password) : _promptPromise2.default.password('password: ')).then(function (password) {
          params.user.password = password;
        });
      }).then(function () {
        return (parameters.wifi.ssid ? Promise.resolve(parameters.wifi.ssid) : (0, _promptPromise2.default)('wifi ssid: ')).then(function (ssid) {
          params.wifi.ssid = ssid;
        });
      }).then(function () {
        return (parameters.wifi.password ? Promise.resolve(parameters.wifi.password) : _promptPromise2.default.password('wifi password for \'' + params.wifi.ssid + '\': ')).then(function (password) {
          params.wifi.password = password;
        });
      }).then(function () {
        return (parameters.node.name ? Promise.resolve(parameters.node.name) : (0, _promptPromise2.default)('wio-node name: ')).then(function (name) {
          params.node.name = name;
        });
      }).then(function () {
        return (parameters.node.ap ? Promise.resolve(parameters.node.ap) : Promise.resolve('')).then(function (ap) {
          params.node.ap = ap;
        });
      }).then(function () {
        startSpin();
        return wio.login(params);
      })
      //      .then(() => wio.createNode())
      //      .then(() => wio.rename(params))
      .then(function () {
        stopSpin();
        process.stdout.write('                          　    ／＼\n');
        process.stdout.write('                              ／　／＼\n');
        process.stdout.write('hold down this button      => |　＼／|\n');
        process.stdout.write(' until blue-light breathes    ＼　　／\n');
        process.stdout.write('                              　＼／\n');
        process.stdout.write('                           　    ┃\n');
        process.stdout.write('\n');
        process.stdout.write('scanning APs ...\n');
        return (0, _promiseLoop2.default)(Promise.resolve(), function () {
          return new Promise(function (resolve) {
            startSpin();
            setTimeout(function () {
              resolve(['WIO_HOGE', 'WIO_FUGA']);
            }, 5000);
          }).then(function (aps) {
            stopSpin();
            if (!aps || aps.length === 0) return { answer: false, aps: aps };
            process.stdout.write(aps.map(function (ap, pos) {
              return '[' + pos + ']: ' + ap;
            }).join('\n') + '\n');
            return (0, _promptPromise2.default)('select AP from above or [r] to re-scan :').then(function (answer) {
              return { answer: answer, aps: aps };
            });;
          }).then(function (result) {
            if (!result.answer) {
              return { done: false };
            } else if (result.answer === 'r') {
              result.aps.forEach(function (ap) {
                process.stdout.moveCursor(0, -1);
                process.stdout.clearLine();
              });
              process.stdout.moveCursor(0, -1);
              return { done: false };
            }
            return { done: true };
          });
        });
      }).then(function () {
        process.stdout.write('done.\n');
      });
    }
  }, {
    key: 'list',
    value: function list(parameters) {
      var _this = this;

      var params = {
        user: {}
      };
      return (parameters.user.email ? Promise.resolve(parameters.user.email) : (0, _promptPromise2.default)('email: ')).then(function (email) {
        params.user.email = email;
      }).then(function () {
        return (parameters.user.password ? Promise.resolve(parameters.user.password) : _promptPromise2.default.password('password: ')).then(function (password) {
          params.user.password = password;
        });
      }).then(function () {
        var pos = 0;
        _this.timeout = setInterval(function () {
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write('' + spin[pos]);
          pos += 1;
          if (pos >= spin.length) pos = 0;
        }, 100);
        return wio.login(params);
      }).then(function () {
        return wio.nodesList();
      }).then(function (result) {
        clearInterval(_this.timeout);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        var separator = '----';
        process.stdout.write(separator + '\n');
        process.stdout.write(result.nodes.map(function (node) {
          return '  name: ' + node.name + '\n  online: ' + node.online + '\n  node_key: ' + node.node_key + '\n  node_sn: ' + node.node_sn;
        }).join('\n' + separator + '\n'));
        process.stdout.write('\n' + separator + '\n');
      });
    }
  }]);

  return WioSetup;
}();
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


exports.default = WioSetup;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sha = require('sha1');

var _sha2 = _interopRequireDefault(_sha);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var API_NODES_CREATE = '/v1/nodes/create';
var API_NODES_LIST = '/v1/nodes/list';
var API_NODES_RENAME = '/v1/nodes/rename';
var HINGE_USER_LOGIN = 'r=common/user/login';
var WIOLINK_APPID = 'wiolink';
var WIOLINK_APPKEY = 'MPP=tGjz</p5';
var WIOLINK_COMMON = 'seeed_wiolink';
var WIOLINK_SOURCE = 4;
var SERVER_OUT_PREFIX = 'http://bazaar.seeed.cc/api/index.php?';
var OTA_INTERNATIONAL_URL = 'https://us.wio.seeed.io';

function getSign(uri, timestamp) {
  return new Promise(function (resolve) {
    var list = [];
    list.push(WIOLINK_APPID);
    list.push(WIOLINK_APPKEY);
    list.push(WIOLINK_COMMON);
    list.push(uri);
    list.push(timestamp);

    return resolve((0, _sha2.default)(list.sort().join('')));
  });
}

var WioSetup = function () {
  function WioSetup() {
    _classCallCheck(this, WioSetup);
  }

  _createClass(WioSetup, [{
    key: 'login',
    value: function login(parameters) {
      var _this = this;

      this.params = parameters;
      var timestamp = '' + parseInt(Date.now() / 1000, 10);
      return getSign(HINGE_USER_LOGIN, timestamp) // create signature
      .then(function (sign) {
        var body = {
          email: _this.params.user.email,
          password: _this.params.user.password,
          timestamp: timestamp,
          sign: sign,
          source: WIOLINK_SOURCE,
          api_key: WIOLINK_APPID
        };
        return _axios2.default.post('' + SERVER_OUT_PREFIX + HINGE_USER_LOGIN, _querystring2.default.stringify(body)).then(function (result) {
          _this.params.user.token = result.data.data.token;
          return result.data;
        });
      });
    }
  }, {
    key: 'createNode',
    value: function createNode() {
      var _this2 = this;

      var instance = _axios2.default.create({
        baseURL: OTA_INTERNATIONAL_URL,
        headers: {
          Authorization: this.params.user.token
        }
      });
      var body = {
        name: 'node000',
        board: 'Wio Node v1.0'
      };
      return instance.post(API_NODES_CREATE, _querystring2.default.stringify(body)).then(function (result) {
        _this2.params.node.sn = result.data.node_sn;
        _this2.params.node.key = result.data.node_key;
        console.log(_this2.params);
        return result.data;
      });
    }
  }, {
    key: 'nodesList',
    value: function nodesList() {
      var instance = _axios2.default.create({
        baseURL: OTA_INTERNATIONAL_URL,
        headers: {
          Authorization: this.params.user.token
        }
      });
      return instance.get(API_NODES_LIST).then(function (result) {
        return result.data;
      });
    }
  }, {
    key: 'rename',
    value: function rename(params) {
      var _this3 = this;

      var instance = _axios2.default.create({
        baseURL: OTA_INTERNATIONAL_URL,
        headers: {
          Authorization: this.params.user.token
        }
      });
      var body = {
        name: params.node.name,
        node_sn: params.node.sn
      };
      return instance.post(API_NODES_RENAME, _querystring2.default.stringify(body)).then(function (result) {
        _this3.params.node = params.node;
        return result.data;
      });
    }
  }]);

  return WioSetup;
}();

exports.default = WioSetup;
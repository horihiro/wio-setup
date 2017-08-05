import Wio from './lib/wio';

export default class WioSetup {
  constructor() {
    this.wio = new Wio();
  }

  setup(params) {
    const r = /[0-9a-f]{32}/;
    return this.wio.login(params)
      .then(() => (params.onLoginSuccess ? params.onLoginSuccess() : null))
      .then(() => (r.test(params.node.sn) && r.test(params.node.key)
        ? Promise.resolve()
        : this.wio.createNode()))
      .then(() => this.wio.rename(params))
      .then(() => (params.onComfirm ? params.onComfirm() : null))
      .then(() => this.wio.updateWifiSetting(params))
      .then(() => {
        process.stdout.write('done.\n');
      });
  }

  list(params) {
    return this.wio.login(params)
      .then(() => (params.onLoginSuccess ? params.onLoginSuccess() : null))
      .then(() => this.wio.nodesList()
      .then(nodeList => nodeList.nodes));
  }

  delete(params) {
    return this.wio.login(params)
      .then(() => (params.onLoginSuccess ? params.onLoginSuccess() : null))
      .then(() => this.wio.delete(params));
  }
}

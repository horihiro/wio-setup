import Wio from './lib/wio';

export default class WioSetup {
  constructor() {
    this.wio = new Wio();
  }

  setup(params) {
    return this.wio.login(params)
      .then(() => (params.onLoginSuccess ? params.onLoginSuccess() : null))
      .then(() => this.wio.createNode())
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
      .then(() => this.wio.nodesList());
  }
}

export default class Wifi {
  static scan() {
    return new Promise((resolve) => {
      resolve(['WIO_HOGE', 'WIO_FUGA', 'OHHO_OIO']);
    });
  }
}

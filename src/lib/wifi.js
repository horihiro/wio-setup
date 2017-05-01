export default class Wifi {
  static scan() {
    return new Promise((resolve, reject) => {
      resolve(['WIO_HOGE', 'WIO_FUGA', 'OHHO_OIO']);
    });
  }
}
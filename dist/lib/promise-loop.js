"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loop;
function loop(promise, fn) {
  return promise.then(fn).then(function (wrapper) {
    return !wrapper.done ? loop(Promise.resolve(wrapper.value), fn) : wrapper.value;
  });
}
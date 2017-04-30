export default function loop(promise, fn) {
  return promise
    .then(fn)
    .then(wrapper => (!wrapper.done ? loop(Promise.resolve(wrapper.value), fn) : wrapper.value));
}

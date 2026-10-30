import { activeEffect } from './effect.js';
import { isObject } from './shared.js';

const proxyCache = new WeakMap();

export function reactive(target) {
  if (proxyCache.has(target)) return proxyCache.get(target);

  const depsMap = new Map();

  const proxy = new Proxy(target, {
    get(target, key) {
      if (activeEffect) {
        let deps = depsMap.get(key);
        if (!deps) {
          deps = new Set();
          depsMap.set(key, deps);
        }
        deps.add(activeEffect);
      }
      const value = target[key];
      return isObject(value) ? reactive(value) : value;
    },
    set(target, key, value) {
      target[key] = value;
      const deps = depsMap.get(key);
      if (deps) deps.forEach(fn => fn());
      return true;
    }
  });

  proxyCache.set(target, proxy);
  return proxy;
}
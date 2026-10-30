import { activeEffect } from './effect.js';
import { reactive } from './reactive.js';
import { isObject } from './shared.js';

const refTargetMap = new WeakMap();

export function ref(value) {
  let inner = isObject(value) ? reactive(value) : value;

  const refObject = {
    get value() {
      if (activeEffect) {
        let depsMap = refTargetMap.get(refObject);
        if (!depsMap) refTargetMap.set(refObject, (depsMap = new Map()));
        let deps = depsMap.get('value');
        if (!deps) depsMap.set('value', (deps = new Set()));
        deps.add(activeEffect);
      }
      return inner;
    },
    set value(next) {
      inner = isObject(next) ? reactive(next) : next;
      const depsMap = refTargetMap.get(refObject);
      if (!depsMap) return;
      const deps = depsMap.get('value');
      if (deps) deps.forEach(fn => fn());
    }
  };

  return refObject;
}
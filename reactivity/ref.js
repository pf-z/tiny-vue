import { activeEffect } from './effect.js';
import { reactive } from './reactive.js';
import { isObject } from './shared.js';

// Cache the mapping between Ref objects and dependency tables.
// WeakMap<refObject, Map<'value', Set<effect wrapped functions>>>
// We use WeakMap because refObject is an object,
// which can serve as a key and does not prevent garbage collection.
const refTargetMap = new WeakMap();

export function ref(value) {

  // If the initial value is an object, wrap it in a reactive proxy first.
  let inner = isObject(value) ? reactive(value) : value;

  const refObject = {

    // Collect dependencies when reading .value.
    get value() {
      if (activeEffect) {
        // Retrieve the dependency table of this ref object.
        let depsMap = refTargetMap.get(refObject);
        // Or initialize it if it doesn't exist.
        if (!depsMap) refTargetMap.set(refObject, (depsMap = new Map()));

        // ref has only one property 'value', with a fixed key.
        let deps = depsMap.get('value');
        if (!deps) depsMap.set('value', (deps = new Set()));

        // Add the current effect to the dependency set.
        deps.add(activeEffect);
      }
      return inner;
    },

    // Trigger dependency updates when writing to .value.
    set value(next) {

      // If the new value is an object, it will also be wrapped as reactive.
      inner = isObject(next) ? reactive(next) : next;

      // Retrieve the dependency map.
      const depsMap = refTargetMap.get(refObject);
      // If absent, it indicates that the value has never been accessed; therefore, triggering is unnecessary.
      if (!depsMap) return;

      // Execute all effects that depend on this ref.
      const deps = depsMap.get('value');
      if (deps) deps.forEach(fn => fn());
    }
  };

  return refObject;
}
import { activeEffect } from './effect.js';
import { isObject } from './shared.js';

// Cache mapping from original object to Proxy.
// When reactive() is called multiple times on the same original object,
// return the same Proxy to avoid redundant creation and loss of dependencies.
const proxyCache = new WeakMap();

export function reactive(target) {

  // If the original object has already been proxied, reuse it directly.
  if (proxyCache.has(target)) return proxyCache.get(target);

  // Each original object corresponds to a dependency table.
  // Structure: Map<property key, Set<effect wrapped functions>>
  const depsMap = new Map();

  const proxy = new Proxy(target, {

    // Collect dependencies when reading attributes.
    get(target, key) {

      // Dependencies are only collected within the effect execution context.
      // If activeEffect is null, it indicates a regular read (non-reactive context), so no collection occurs.
      if (activeEffect) {
        let deps = depsMap.get(key);
        if (!deps) {
          // Initialize the dependency set upon the first read of this property.
          deps = new Set();
          depsMap.set(key, deps);
        }
        // Add the current effect to the dependency set of this property.
        deps.add(activeEffect);
      }

      const value = target[key];
      // If the property value is an object, recursively wrap it to make it reactive, enabling deep reactivity.
      return isObject(value) ? reactive(value) : value;
    },

    // Trigger dependency update when writing properties.
    set(target, key, value) {

      // Write the original object first.
      target[key] = value;

      // Retrieve the set of dependencies collected by this attribute and execute them one by one.
      // This executes the wrapped function inside effect, which will re-render the component.
      const deps = depsMap.get(key);
      if (deps) deps.forEach(fn => fn());

      return true;
    }
  });

  // Cache the proxy, and return the same original object directly next time.
  proxyCache.set(target, proxy);
  return proxy;
}
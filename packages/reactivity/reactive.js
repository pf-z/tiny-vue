import { activeEffect } from './effect.js';
import { isObject } from './shared.js';

// 缓存原始对象 → Proxy 的映射
// 同一个原始对象多次调用 reactive() 时返回同一个 Proxy，避免重复创建和依赖丢失
const proxyCache = new WeakMap();

export function reactive(target) {
  // 如果该原始对象已经创建过 Proxy，直接复用
  if (proxyCache.has(target)) return proxyCache.get(target);

  // 每个原始对象对应一份依赖表
  // 结构：Map<属性key, Set<effect wrapped 函数>>
  const depsMap = new Map();

  const proxy = new Proxy(target, {
    // 读取属性时收集依赖
    get(target, key) {
      // 只有在 effect 执行上下文中才收集依赖
      // activeEffect 为 null 说明是普通读取（非响应式上下文），不收集
      if (activeEffect) {
        let deps = depsMap.get(key);
        if (!deps) {
          // 该属性第一次被读取，初始化依赖集合
          deps = new Set();
          depsMap.set(key, deps);
        }
        // 把当前 effect 加入该属性的依赖集合
        deps.add(activeEffect);
      }

      const value = target[key];
      // 如果属性值是对象，递归包装成响应式，实现深层响应
      return isObject(value) ? reactive(value) : value;
    },

    // 写入属性时触发依赖更新
    set(target, key, value) {
      // 先写入原始对象
      target[key] = value;

      // 取出该属性收集的依赖集合，逐个执行
      // 这里执行的是 effect 里的 wrapped 函数，会重新渲染组件
      const deps = depsMap.get(key);
      if (deps) deps.forEach(fn => fn());

      return true;
    }
  });

  // 缓存 Proxy，下次同一原始对象直接返回
  proxyCache.set(target, proxy);
  return proxy;
}
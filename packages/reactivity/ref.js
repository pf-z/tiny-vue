import { activeEffect } from './effect.js';
import { reactive } from './reactive.js';
import { isObject } from './shared.js';

// 缓存 ref 对象 → 依赖表的映射
// WeakMap<refObject, Map<'value', Set<effect wrapped 函数>>>
// 用 WeakMap 是因为 refObject 是对象，可作为 key，且不阻止垃圾回收
const refTargetMap = new WeakMap();

export function ref(value) {
  // 如果初始值是对象，先包装成响应式
  // 这样 ref({ count: 0 }) 时，.value.count 的变化也能被追踪
  let inner = isObject(value) ? reactive(value) : value;

  const refObject = {
    // 读取 .value 时收集依赖
    get value() {
      // 只有在 effect 执行上下文中才收集依赖
      if (activeEffect) {
        // 取出该 ref 对象的依赖表，没有则初始化
        let depsMap = refTargetMap.get(refObject);
        if (!depsMap) refTargetMap.set(refObject, (depsMap = new Map()));

        // ref 只有一个属性 'value'，固定 key
        let deps = depsMap.get('value');
        if (!deps) depsMap.set('value', (deps = new Set()));

        // 把当前 effect 加入依赖集合
        deps.add(activeEffect);
      }
      return inner;
    },

    // 写入 .value 时触发依赖更新
    set value(next) {
      // 新值如果是对象，同样包装成响应式
      inner = isObject(next) ? reactive(next) : next;

      // 取出依赖表，没有说明从未被读取过，无需触发
      const depsMap = refTargetMap.get(refObject);
      if (!depsMap) return;

      // 执行所有依赖该 ref 的 effect
      const deps = depsMap.get('value');
      if (deps) deps.forEach(fn => fn());
    }
  };

  return refObject;
}
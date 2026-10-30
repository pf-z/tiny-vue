export let activeEffect = null;
const effectStack = [];
let effectDepth = 0;
const MAX_DEPTH = 100;

export function effect(fn) {
  const wrapped = () => {
    // 自递归直接跳过（同一 effect 已在栈中）
    if (effectStack.includes(wrapped)) return;
    // 嵌套深度超限：A 触发 B、B 触发 A 的闭环
    if (effectDepth >= MAX_DEPTH) {
      throw new Error('[reactivity] effect 循环触发超过最大深度，请检查依赖闭环');
    }
    try {
      effectStack.push(wrapped);
      activeEffect = wrapped;
      effectDepth++;
      fn();
    } finally {
      effectDepth--;
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  };
  wrapped();
  return wrapped;
}
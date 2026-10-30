// 当前正在执行的副作用函数
// reactive/ref 的 get 里通过读取它来判断是否处于 effect 执行上下文，从而收集依赖
// 它是个全局单例，只在 wrapped() 执行期间有值，其余时间为 null
export let activeEffect = null;

// 副作用函数执行栈
// 用于处理 effect 嵌套：内层 effect 执行完后，activeEffect 要恢复成外层 effect，而不是直接置 null
const effectStack = [];

// 当前 effect 嵌套深度
let effectDepth = 0;
// 最大嵌套深度，防止 A 触发 B、B 又触发 A 的无限循环
const MAX_DEPTH = 100;

export function effect(fn) {
  // wrapped 是对用户传入 fn 的包装
  // 依赖收集时收集的是 wrapped（而不是 fn），这样触发时调用 wrapped 能重新建立 activeEffect 上下文
  const wrapped = () => {
    // 自递归保护：同一个 effect 已经在执行栈中，说明是它自己触发的自己
    // 直接返回，避免无限递归
    if (effectStack.includes(wrapped)) return;

    // 嵌套深度保护：effect 之间互相触发形成闭环时，深度会持续增长
    // 超过上限直接抛错，暴露依赖循环问题
    if (effectDepth >= MAX_DEPTH) {
      throw new Error('[reactivity] effect 循环触发超过最大深度，请检查依赖闭环');
    }

    try {
      // 入栈并把 activeEffect 指向自己
      // 这样 fn() 执行期间，所有 reactive/ref 的 get 都能收集到当前 wrapped
      effectStack.push(wrapped);
      activeEffect = wrapped;
      effectDepth++;

      // 执行用户逻辑（例如组件 render）
      fn();
    } finally {
      // 无论 fn 是否抛错，都要恢复现场
      effectDepth--;
      effectStack.pop();

      // 关键：不能直接置 null
      // 如果存在外层 effect，activeEffect 要恢复成外层 effect
      // 否则外层 effect 后续的读取就无法收集依赖
      activeEffect = effectStack[effectStack.length - 1] || null;
    }
  };

  // 首次执行，建立初始依赖收集
  wrapped();

  // 返回 wrapped，便于外部手动触发或用于卸载
  return wrapped;
}
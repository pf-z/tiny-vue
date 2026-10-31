/*
 * 负责 vnode 的创建、挂载（mount）和更新（patch）
 */

/**
 * 把 vnode props 里的事件属性名转换成原生 DOM 事件名
 * e.g. onClick → click, onInput → input, onKeydown → keydown
 *
 * @param key 事件属性名
 * @returns {string} 去掉 on 前缀后的结果
 */
function getEventName(key) {
  return key.slice(2).toLowerCase();
}


/**
 创建一个 vnode（虚拟节点）对象：
 *
 * @param tag 标签名（'div'、'button'）或组件函数（在 template/render.js 里处理）
 * @param props 属性对象，包含普通属性（class、id）、事件（onClick）、受控属性（value、checked）
 * @param children 子节点，可以是字符串、数字、vnode、数组，或它们的混合
 * @returns {{tag: *, props, children: *, el: null}}
 */
export function h(tag, props, children) {

  // props || {}：允许 h('div') 不传 props，避免后面 for (const key in vnode.props) 报错
  // el 初始为 null，mount 时赋值为真实 DOM 节点，patch 时用来定位旧节点
  return { tag, props: props || {}, children, el: null };
}


/**
 * 判断一个值是不是合法的 vnode 对象，判断条件：
 *  - 非 null/undefined
 *  - 是对象
 *  - 不是数组（数组是 children 容器，不是节点）
 *  - tag 是字符串（排除组件函数、排除 { tag: undefined } 这种脏数据）
 *
 * @param v vnode
 * @returns {boolean} true or false
 */
function isVNode(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && typeof v.tag === 'string';
}


/**
 * 判断是否是文本节点（字符串或数字）
 *
 * @param v
 * @returns {boolean}
 */
function isPrimitive(v) {
  return typeof v === 'string' || typeof v === 'number';
}


/**
 * 把任意嵌套的 children 展平成一维数组，同时过滤掉 null、undefined、true、false
 * e.g. flatten([['a', null], 'b', [['c']], false])  →  ['a', 'b', 'c']
 * attention: 其他类型（函数、对象）会被丢弃。这是有意的，防止误传函数或普通对象进 DOM。
 *
 * @param children 嵌套的 children
 * @param result 累加器，默认 []，递归调用时传同一个数组，避免每次创建新数组
 * @returns {*[]}
 */
function flatten(children, result = []) {

  // null / undefined，true / false 跳过（boolean 不作为文本渲染）
  if (children == null || children === false || children === true) return result;

  // 如果是数组，就遍历并递归处理
  if (Array.isArray(children)) {
    for (const c of children) flatten(c, result);
    return result;
  }

  // 字符串 / 数字，压入
  if (isPrimitive(children) || isVNode(children)) {
    result.push(children);
  }
  return result;
}


/**
 * 安全地设置表单元素的 value，只在值真的变化时才赋值
 *
 * @param el
 * @param value
 */
function setValue(el, value) {

  // value 为 null/undefined 时转成空字符串，避免 el.value = null 变成 "null"
  const v = value == null ? '' : String(value);

  // 只在值变化时赋值
  if (el.value !== v) {
    el.value = v;
  }
}


/**
 * 安全地设置 checkbox/radio 的 checked，只在状态变化时赋值
 *
 * @param el
 * @param value
 */
function setChecked(el, value) {

  // checked 是布尔属性，但模板里可能传 "true"、1、undefined 等
  // !!value 统一转布尔
  const v = !!value;

  if (el.checked !== v) {
    el.checked = v;
  }
}


/**
 * 把 vnode 树转换成真实 DOM，挂到 container 下。这是首次渲染的入口。
 *
 * @param vnode
 * @param container
 */
export function mount(vnode, container) {

  // 字符串/数字：直接创建文本节点
  if (isPrimitive(vnode)) {
    container.appendChild(document.createTextNode(String(vnode)));
    return;
  }

  // null/undefined/boolean：不渲染任何东西，跳过
  if (vnode == null || typeof vnode === 'boolean') {
    return;
  }

  // 数组：逐个 mount
  // 这里没有用 flatten，因为 mount 的数组分支本身就是递归展开，flatten 在 children 处理时用
  if (Array.isArray(vnode)) {
    vnode.forEach(child => mount(child, container));
    return;
  }

  // 创建真实 DOM
  const el = document.createElement(vnode.tag);
  // 把真实 DOM 存回 vnode，后续 patch 时通过 oldVNode.el 定位旧 DOM
  vnode.el = el;

  // 设置 props，按优先级处理
  for (const key in vnode.props) {
    const value = vnode.props[key];
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(getEventName(key), value);  // 事件
    } else if (key === 'value') {
      setValue(el, value);  // 处理光标问题
    } else if (key === 'checked') {
      setChecked(el, value);  // checked
    } else if (value === true) {
      el.setAttribute(key, '');
    } else if (value !== false && value != null) {
      el.setAttribute(key, value);
    }
  }

  // 挂载 children
  const children = vnode.children;
  if (isPrimitive(children)) {
    el.textContent = String(children);
  } else if (children != null && children !== false) {
    flatten(children).forEach(c => mount(c, el));
  }

  // children 挂载后，对 select/input 再同步一次值
  // 原因：<select> 的 value 只有在 option 存在时才能设置成功
  if (vnode.tag === 'select') {
    setValue(el, vnode.props.value);
  } else if (vnode.tag === 'input' && 'checked' in vnode.props) {
    setChecked(el, vnode.props.checked);
  }

  // 挂到容器
  container.appendChild(el);
}


/**
 * 对比新旧 vnode，更新真实 DOM。这是响应式更新的核心
 *
 * @param oldVNode
 * @param newVNode
 * @param container
 */
export function patch(oldVNode, newVNode, container) {
  // 非 vnode（字符串/数组/null）不在 patch 顶层处理，由 patchChildren 负责
  if (!isVNode(oldVNode) || !isVNode(newVNode)) {
    return;
  }

  // tag 不同（div 变成 ul），无法复用 DOM，只能替换
  if (oldVNode.tag !== newVNode.tag) {
    // 找到旧 DOM 的父节点 parent
    const oldEl = oldVNode.el;
    const parent = oldEl && oldEl.parentNode;
    // 如果不存在，直接挂载
    if (!parent) {
      mount(newVNode, container);
      return;
    }
    // 在临时 wrapper 里 mount 新 vnode
    const wrapper = document.createElement('div');
    mount(newVNode, wrapper);
    // 用新节点替换旧节点
    parent.replaceChild(newVNode.el, oldEl);
    return;
  }

  // tag 相同，复用旧 DOM
  const el = (newVNode.el = oldVNode.el);
  // 更新属性、事件、value、checked
  patchProps(el, oldVNode.props, newVNode.props);
  // 更新子节点
  patchChildren(el, oldVNode.children, newVNode.children);

  // children patch 后，select 的 option 已存在，再同步一次 value
  if (newVNode.tag === 'select') {
    setValue(el, newVNode.props.value);
  }
}


/**
 * 对比新旧 props，只更新变化的部分
 *
 * @param el
 * @param oldProps
 * @param newProps
 */
function patchProps(el, oldProps, newProps) {

  // 遍历 oldProps
  for (const key in oldProps) {
    // 如果 key 不在 newProps 里，就需要删除
    if (!(key in newProps)) {
      const value = oldProps[key];
      if (key.startsWith('on') && typeof value === 'function') {
        el.removeEventListener(getEventName(key), value);
      } else if (key !== 'value' && key !== 'checked') {
        el.removeAttribute(key);
      }
    }
  }

  // 遍历 newProps
  for (const key in newProps) {
    const next = newProps[key];
    const prev = oldProps[key];
    if (prev === next) continue;

    if (key.startsWith('on') && typeof next === 'function') {
      if (typeof prev === 'function') el.removeEventListener(getEventName(key), prev);
      el.addEventListener(getEventName(key), next);
    } else if (key === 'value') {
      setValue(el, next);
    } else if (key === 'checked') {
      setChecked(el, next);
    } else if (next === true) {
      el.setAttribute(key, '');
    } else if (next === false || next == null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, next);
    }
  }
}


/**
 * 对比新旧 children，更新父元素 el 的子节点
 *
 * @param el
 * @param oldChildren
 * @param newChildren
 */
function patchChildren(el, oldChildren, newChildren) {
  const oldIsPrim = isPrimitive(oldChildren);
  const newIsPrim = isPrimitive(newChildren);

  // 1) 旧 children 和新 children 都是字符串/数字，直接比较文本。相同不操作，不同 el.textContent = ...
  // e.g. <span>${count}</span>，count 从 1 变 2，textContent 从 "1" 变 "2"
  if (oldIsPrim && newIsPrim) {
    if (String(oldChildren) !== String(newChildren)) {
      el.textContent = String(newChildren);
    }
    return;
  }

  // 2) 类型不同（primitive ↔ 数组/空）：清空重建
  if (oldIsPrim !== newIsPrim) {
    // 新 children 为空：el.textContent = ''，清空
    if (newChildren == null || newChildren === '' || newChildren === false) {
      el.textContent = '';
      return;
    }
    el.textContent = '';
    if (newIsPrim) {
      // 新 children 是 primitive：设 textContent
      el.textContent = String(newChildren);
    } else {
      // 新 children 是数组：清空后 flatten 逐个 mount
      flatten(newChildren).forEach(c => mount(c, el));
    }
    return;
  }

  // 3) 都不是 primitive：flatten 后对比
  const oldArr = flatten(oldChildren);
  const newArr = flatten(newChildren);

  // 数组里有 primitive（如 [<span>, "text"]）：整块重建，保证文本节点正确
  const hasPrim = oldArr.some(c => !isVNode(c)) || newArr.some(c => !isVNode(c));
  if (hasPrim) {
    el.textContent = '';
    newArr.forEach(c => mount(c, el));
    return;
  }

  // 全是 vnode：按 index patch
  const common = Math.min(oldArr.length, newArr.length);
  for (let i = 0; i < common; i++) {
    const o = oldArr[i];
    const n = newArr[i];
    if (o.tag !== n.tag) {
      const oldEl = o.el;
      const parent = oldEl && oldEl.parentNode;
      if (parent) {
        const wrapper = document.createElement('div');
        mount(n, wrapper);
        parent.replaceChild(n.el, oldEl);
      } else {
        mount(n, el);
      }
    } else {
      patch(o, n, el);
    }
  }
  for (let i = common; i < oldArr.length; i++) {
    const oldEl = oldArr[i].el;
    if (oldEl && oldEl.parentNode === el) el.removeChild(oldEl);
  }
  for (let i = common; i < newArr.length; i++) {
    mount(newArr[i], el);
  }
}
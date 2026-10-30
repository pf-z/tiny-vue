function getEventName(key) {
  return key.slice(2).toLowerCase();
}

export function h(tag, props, children) {
  return { tag, props: props || {}, children, el: null };
}

function isVNode(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && typeof v.tag === 'string';
}

function isPrimitive(v) {
  return typeof v === 'string' || typeof v === 'number';
}

function flatten(children, result = []) {
  if (children == null || children === false || children === true) return result;
  if (Array.isArray(children)) {
    for (const c of children) flatten(c, result);
    return result;
  }
  if (isPrimitive(children) || isVNode(children)) {
    result.push(children);
  }
  return result;
}

function setValue(el, value) {
  const v = value == null ? '' : String(value);
  if (el.value !== v) {
    el.value = v;
  }
}

function setChecked(el, value) {
  const v = !!value;
  if (el.checked !== v) {
    el.checked = v;
  }
}

export function mount(vnode, container) {
  // 字符串/数字：直接创建文本节点
  if (isPrimitive(vnode)) {
    container.appendChild(document.createTextNode(String(vnode)));
    return;
  }

  // null/undefined/boolean：跳过
  if (vnode == null || typeof vnode === 'boolean') {
    return;
  }

  // 数组：逐个 mount
  if (Array.isArray(vnode)) {
    vnode.forEach(child => mount(child, container));
    return;
  }

  const el = document.createElement(vnode.tag);
  vnode.el = el;

  for (const key in vnode.props) {
    const value = vnode.props[key];
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(getEventName(key), value);
    } else if (key === 'value') {
      setValue(el, value);
    } else if (key === 'checked') {
      setChecked(el, value);
    } else if (value === true) {
      el.setAttribute(key, '');
    } else if (value !== false && value != null) {
      el.setAttribute(key, value);
    }
  }

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

  container.appendChild(el);
}

export function patch(oldVNode, newVNode, container) {
  // 非 vnode（字符串/数组/null）不在 patch 顶层处理，由 patchChildren 负责
  if (!isVNode(oldVNode) || !isVNode(newVNode)) {
    return;
  }

  if (oldVNode.tag !== newVNode.tag) {
    const oldEl = oldVNode.el;
    const parent = oldEl && oldEl.parentNode;
    if (!parent) {
      mount(newVNode, container);
      return;
    }
    const wrapper = document.createElement('div');
    mount(newVNode, wrapper);
    parent.replaceChild(newVNode.el, oldEl);
    return;
  }

  const el = (newVNode.el = oldVNode.el);
  patchProps(el, oldVNode.props, newVNode.props);
  patchChildren(el, oldVNode.children, newVNode.children);

  // children patch 后，select 的 option 已存在，再同步一次 value
  if (newVNode.tag === 'select') {
    setValue(el, newVNode.props.value);
  }
}

function patchProps(el, oldProps, newProps) {
  for (const key in oldProps) {
    if (!(key in newProps)) {
      const value = oldProps[key];
      if (key.startsWith('on') && typeof value === 'function') {
        el.removeEventListener(getEventName(key), value);
      } else if (key !== 'value' && key !== 'checked') {
        el.removeAttribute(key);
      }
    }
  }

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

function patchChildren(el, oldChildren, newChildren) {
  const oldIsPrim = isPrimitive(oldChildren);
  const newIsPrim = isPrimitive(newChildren);

  // 1) 都是 primitive：比较后设 textContent
  if (oldIsPrim && newIsPrim) {
    if (String(oldChildren) !== String(newChildren)) {
      el.textContent = String(newChildren);
    }
    return;
  }

  // 2) 类型不同（primitive ↔ 数组/空）：清空重建
  if (oldIsPrim !== newIsPrim) {
    if (newChildren == null || newChildren === '' || newChildren === false) {
      el.textContent = '';
      return;
    }
    el.textContent = '';
    if (newIsPrim) {
      el.textContent = String(newChildren);
    } else {
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
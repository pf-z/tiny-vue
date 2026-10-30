import { h } from '../runtime-dom/nodeOps.js';
import { escapeHtml } from './escape.js';

const SLOT_RE = /__SLOT_(\d+)__/g;
const SLOT_EXACT_RE = /^__SLOT_(\d+)__$/;

function isBlank(v) {
  return typeof v === 'string' && v.trim() === '';
}

function pushRendered(target, rendered) {
  if (Array.isArray(rendered)) {
    for (const item of rendered) {
      if (item == null || item === false || item === undefined) continue;
      if (isBlank(item)) continue;
      target.push(item);
    }
  } else if (rendered !== null && rendered !== undefined && rendered !== false) {
    if (isBlank(rendered)) return;
    target.push(rendered);
  }
}

export function renderAST(ast, values) {
  const nodes = [];
  for (const child of ast.children) {
    pushRendered(nodes, renderNode(child, values));
  }
  return nodes;
}

function renderNode(node, values) {
  if (node.type === 'text') return renderText(node.value, values);
  if (node.type === 'element') return renderElement(node, values);
  return null;
}

function renderText(text, values) {
  if (!text.includes('__SLOT_')) return text;

  const trimmed = text.trim();
  const exact = trimmed.match(SLOT_EXACT_RE);
  if (exact) return values[Number(exact[1])];

  return text.replace(SLOT_RE, (_, idx) => {
    const v = values[Number(idx)];
    return v == null ? '' : escapeHtml(v);
  });
}

function renderElement(node, values) {
  const tagSlot = node.tag.match(SLOT_EXACT_RE);
  if (tagSlot) {
    const Component = values[Number(tagSlot[1])];
    if (typeof Component !== 'function') {
      throw new TypeError(`[template] 组件必须是函数，收到 ${typeof Component}`);
    }
    const props = renderProps(node.attrs, values);
    const children = renderChildren(node.children, values);
    return Component({ ...props, children: normalizeChildren(children) });
  }

  const props = renderProps(node.attrs, values);
  const children = renderChildren(node.children, values);
  return h(node.tag, props, normalizeChildren(children));
}

function renderProps(attrs, values) {
  const props = {};
  for (const attr of attrs) {
    const { name, value, hasValue } = attr;

    if (!hasValue) {
      props[name] = true;
      continue;
    }

    if (/^on[A-Z]/.test(name)) {
      const fn = resolveSlot(value, values);
      if (typeof fn !== 'function') throw new TypeError(`[template] 事件 ${name} 必须是函数`);
      props[name] = fn;
      continue;
    }

    props[name] = resolveAttrValue(value, values);
  }
  return props;
}

function resolveSlot(value, values) {
  const exact = value.match(SLOT_EXACT_RE);
  if (!exact) return value;
  return values[Number(exact[1])];
}

function resolveAttrValue(value, values) {
  const exact = value.match(SLOT_EXACT_RE);
  if (exact) return values[Number(exact[1])];

  return value.replace(SLOT_RE, (_, idx) => {
    const v = values[Number(idx)];
    return v == null ? '' : String(v);
  });
}

function renderChildren(children, values) {
  const result = [];
  for (const child of children) {
    pushRendered(result, renderNode(child, values));
  }
  return result;
}

function normalizeChildren(children) {
  if (children.length === 0) return '';
  if (children.length === 1 && typeof children[0] === 'string') return children[0];
  return children;
}
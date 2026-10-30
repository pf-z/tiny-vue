import { parse } from './parser.js';
import { renderAST } from './render.js';

export function html(strings, ...values) {
  let source = '';
  for (let i = 0; i < strings.length; i++) {
    source += strings[i];
    if (i < values.length) source += `__SLOT_${i}__`;
  }

  const ast = parse(source);
  let nodes = renderAST(ast, values);

  // 过滤纯空白文本节点
  nodes = nodes.filter(n => !(typeof n === 'string' && n.trim() === ''));

  if (nodes.length === 0) return null;
  if (nodes.length === 1) return nodes[0];
  return nodes;
}

export { parse } from './parser.js';
export { renderAST } from './render.js';
export { escapeHtml } from './escape.js';
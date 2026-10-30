const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

const RAW_TEXT_TAGS = new Set(['script', 'style']);

export function parse(source) {
  let i = 0;
  const root = { type: 'root', children: [] };
  const stack = [root];

  function error(msg, pos = i) {
    const line = source.slice(0, pos).split('\n').length;
    throw new SyntaxError(`[template] ${msg} (line ${line})`);
  }

  function current() {
    return stack[stack.length - 1];
  }

  function pushText(value) {
    if (value) current().children.push({ type: 'text', value });
  }

  while (i < source.length) {
    if (source[i] !== '<') {
      let end = source.indexOf('<', i);
      if (end === -1) end = source.length;
      pushText(source.slice(i, end));
      i = end;
      continue;
    }

    if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i + 4);
      if (end === -1) error('注释未闭合');
      i = end + 3;
      continue;
    }

    if (source[i + 1] === '/') {
      const end = source.indexOf('>', i);
      if (end === -1) error('结束标签未闭合');
      const tag = source.slice(i + 2, end).trim().toLowerCase();
      i = end + 1;

      let matched = false;
      while (stack.length > 1) {
        const top = stack.pop();
        if (top.tag === tag) {
          matched = true;
          break;
        }
      }
      if (!matched) error(`多余的结束标签 </${tag}>`);
      continue;
    }

    const { tag, attrs, selfClosing, end } = readStartTag();
    i = end;

    const node = { type: 'element', tag, attrs, children: [], selfClosing };
    current().children.push(node);

    if (selfClosing || VOID_TAGS.has(tag)) continue;

    if (RAW_TEXT_TAGS.has(tag)) {
      const close = source.toLowerCase().indexOf(`</${tag}`, i);
      if (close === -1) error(`<${tag}> 未闭合`);
      const raw = source.slice(i, close);
      if (raw) node.children.push({ type: 'text', value: raw });
      i = source.indexOf('>', close) + 1;
      continue;
    }

    stack.push(node);
  }

  if (stack.length > 1) error(`标签 <${stack[stack.length - 1].tag}> 未闭合`);

  return root;

  function readStartTag() {
    let j = i + 1;
    const tagStart = j;
    while (j < source.length && /[^\s/>]/.test(source[j])) j++;
    if (j === tagStart) error('标签名为空');
    const tag = source.slice(tagStart, j).toLowerCase();

    const attrs = [];
    let selfClosing = false;

    while (j < source.length) {
      while (j < source.length && /\s/.test(source[j])) j++;
      if (j >= source.length) error(`<${tag}> 未闭合`);

      if (source[j] === '/') {
        if (source[j + 1] !== '>') error('自闭合标签格式错误');
        selfClosing = true;
        j += 2;
        return { tag, attrs, selfClosing, end: j };
      }

      if (source[j] === '>') {
        j++;
        return { tag, attrs, selfClosing, end: j };
      }

      const nameStart = j;
      while (j < source.length && /[^\s=/>]/.test(source[j])) j++;
      const name = source.slice(nameStart, j);
      if (!name) error('属性名为空');

      while (j < source.length && /\s/.test(source[j])) j++;

      if (source[j] !== '=') {
        attrs.push({ name, value: null, hasValue: false });
        continue;
      }

      j++;
      while (j < source.length && /\s/.test(source[j])) j++;

      let value;
      const quote = source[j];
      if (quote === '"' || quote === "'") {
        j++;
        const valueStart = j;
        while (j < source.length && source[j] !== quote) j++;
        if (j >= source.length) error(`属性 ${name} 引号未闭合`);
        value = source.slice(valueStart, j);
        j++;
      } else {
        const valueStart = j;
        while (j < source.length && /[^\s>]/.test(source[j])) j++;
        value = source.slice(valueStart, j);
      }

      attrs.push({ name, value, hasValue: true });
    }

    error(`<${tag}> 未闭合`);
  }
}
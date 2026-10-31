# tiny-vue

A minimal Vue-like framework built from scratch — reactivity, virtual DOM, template compiler, and two working demos.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://liuchangyong.github.io/tiny-vue/demos/)
[![JavaScript](https://img.shields.io/badge/language-JavaScript-f7df1e?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Dependencies](https://img.shields.io/badge/dependencies-0-blue)](package.json)

## Overview

`tiny-vue` is a hand-written mini implementation of a Vue-like framework. It covers the core ideas behind modern reactive UI frameworks:

- **Reactivity** — `reactive` / `ref` with dependency tracking and effect scheduling
- **Runtime DOM** — vnode creation, `mount`, and a `patch` algorithm for DOM updates
- **Template compiler** — tagged template `html` that parses to vnodes
- **App entry** — `createApp` wiring the render effect to the DOM

Two demos are included: a minimal counter and a full todo list.

## Live Demos

| Demo | Description | Link |
|------|-------------|------|
| Counter | Minimal reactive loop: `reactive → effect → patch` | [Open](https://pfzh.me/tiny-vue/demos/counter/) |
| Todo List | Components, filters, editing, localStorage persistence | [Open](https://pfzh.me/tiny-vue/demos/todo-list/) |

## Project Structure

```
tiny-vue/
├── reactivity/       # reactive, ref, effect
├── runtime-dom/      # h, mount, patch, createApp
├── template/         # html tagged template, parser, renderer
├── core/             # unified entry point
├── demos/
│   ├── counter/
│   └── todo-list/
│   └── index.html
└── package.json
```

## Getting Started

No build step, no dependencies. Just serve the project root:

```bash
npx serve .
```

Then open:

- `http://localhost:3000/demos/counter/`
- `http://localhost:3000/demos/todo-list/`

## Usage

```js
import { reactive, html, createApp } from './core/index.js';

const state = reactive({ count: 0 });

const App = {
  render() {
    return html`
      <div>
        <p>Count: ${state.count}</p>
        <button onClick="${() => state.count++}">+1</button>
      </div>
    `;
  }
};

createApp(App, document.getElementById('root'));
```

## Core Modules

### `reactivity`

- `reactive(obj)` — Proxy-based deep reactivity with per-key dependency maps
- `ref(value)` — Wraps primitives and objects in a `.value` accessor
- `effect(fn)` — Registers a side effect; re-runs when tracked dependencies change

Dependency tracking uses a global `activeEffect` and an `effectStack` to support nested effects and prevent self-recursion.

### `runtime-dom`

- `h(tag, props, children)` — Creates a vnode
- `mount(vnode, container)` — Renders a vnode tree to real DOM
- `patch(oldVNode, newVNode, container)` — Diffs and updates in place
- `createApp(rootComponent, container)` — Wraps render in an effect, handles mount/patch, exposes `unmount()`

### `template`

- `html\`...\`` — Tagged template that parses markup into vnodes
- Supports interpolation, attribute binding, event handlers (`onClick`, `onInput`, ...), and component slots

## Deployment

The repository ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes the entire repo to GitHub Pages on every push to `main`.

If you fork this project, update the badge links and the live demo table to point to your own GitHub Pages URL.

## License

[MIT](LICENSE)
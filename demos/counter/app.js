import { reactive, h, createApp } from '/core/index.js';

// 1. State: A reactive object
const state = reactive({ count: 0 });

// 2. Root component: just one render, returning a vnode
const App = {
  render() {
    return h('div', { id: 'demo' }, [
      h('p', {}, ['Count', h('span', {}, [String(state.count)])]),
      h('button', { onClick: () => { state.count++; } }, ['+1'])
    ]);
  }
};

// 3. Mount: wrap App.render with effect inside createApp
createApp(App, document.getElementById('root'));
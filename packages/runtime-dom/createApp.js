import { effect } from '../reactivity/index.js';
import { mount, patch } from './nodeOps.js';

export function createApp(rootComponent, container) {
  let oldVNode = null;
  let active = true;

  const render = () => {
    if (!active) return;
    const newVNode = rootComponent.render();
    if (oldVNode) {
      patch(oldVNode, newVNode, container);
    } else {
      mount(newVNode, container);
    }
    oldVNode = newVNode;
  };

  effect(render);

  return {
    unmount() {
      active = false;
      if (oldVNode && oldVNode.el && oldVNode.el.parentNode === container) {
        container.removeChild(oldVNode.el);
      }
      oldVNode = null;
    }
  };
}
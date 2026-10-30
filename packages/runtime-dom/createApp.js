import { effect } from '../reactivity/index.js';
import { mount, patch } from './nodeOps.js';

export function createApp(rootComponent, container) {

  // Reference to the previous vnode tree, used as the baseline for patch().
  let oldVNode = null;

  // Lifecycle flag. After unmount(), the effect may still be triggered by
  // reactive updates, but render() will bail out early.
  let active = true;

  const render = () => {

    // Skip rendering if the app has been unmounted
    if (!active) return;

    // Build a fresh vnode tree from the root component.
    // All component functions are called here,
    // and every reactive read during this call registers `render`'s effect.
    const newVNode = rootComponent.render();

    if (oldVNode) {
      // Subsequent renders: diff old vs new and update the real DOM in place.
      patch(oldVNode, newVNode, container);
    } else {
      // First render: create the whole DOM tree and append it to the container.
      mount(newVNode, container);
    }

    // Keep the new tree as the baseline for the next patch.
    oldVNode = newVNode;
  };

  // Register render() as the single reactive effect of this app.
  // Any reactive property read inside rootComponent.render() (and all
  // nested component calls) will be tracked. When any of those properties
  // change, this effect re-runs render() and the DOM is updated.
  effect(render);

  return {
    unmount() {
      // Disable future renders triggered by reactive updates.
      active = false;

      // Remove the root DOM node from the container if it is still attached
      if (oldVNode && oldVNode.el && oldVNode.el.parentNode === container) {
        container.removeChild(oldVNode.el);
      }

      // Release the vnode reference so it can be garbage collected.
      oldVNode = null;
    }
  };
}
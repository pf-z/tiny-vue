import { html } from '../../packages/vue/index.js';
import { store, clearDone, clearAll } from '../store.js';

export function Footer() {
  const hasDone = store.list.some(t => t.done);
  const hasAny = store.list.length > 0;

  return html`
    <footer class="footer">
      <button
        class="${hasDone ? 'footer-btn' : 'footer-btn disabled'}"
        onClick="${() => { if (hasDone) clearDone(); }}"
      >清除已完成</button>
      <button
        class="${hasAny ? 'footer-btn danger' : 'footer-btn danger disabled'}"
        onClick="${() => { if (hasAny) clearAll(); }}"
      >全部清除</button>
    </footer>
  `;
}
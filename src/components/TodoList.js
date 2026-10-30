import { html } from '../../packages/vue/index.js';
import { visibleList } from '../store.js';
import { TodoItem } from './TodoItem.js';

export function TodoList() {
  const list = visibleList();

  if (list.length === 0) {
    return html`<div class="empty">没有符合条件的待办</div>`;
  }

  return html`
    <ul class="list">
      ${list.map(todo => TodoItem(todo))}
    </ul>
  `;
}
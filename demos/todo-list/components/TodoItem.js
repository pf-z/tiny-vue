import { html } from '../../../core/index.js';
import {
  toggleTodo, removeTodo, startEdit, saveEdit, cancelEdit, editingId, editText
} from '../store.js';
import { formatDate, isOverdue, isToday } from '../utils.js';

const LABEL = { high: '高', medium: '中', low: '低' };

export function TodoItem(todo) {
  if (editingId.value === todo.id) {
    return html`
      <li class="item editing">
        <input
          type="text"
          class="edit-input"
          value="${editText.value}"
          onInput="${e => { editText.value = e.target.value; }}"
          onKeydown="${e => {
            if (e.key === 'Enter') saveEdit(todo);
            if (e.key === 'Escape') cancelEdit();
          }}"
        />
        <button class="mini-btn save" onClick="${() => saveEdit(todo)}">保存</button>
        <button class="mini-btn" onClick="${cancelEdit}">取消</button>
      </li>
    `;
  }

  const dueClass = todo.due
    ? (isOverdue(todo.due) && !todo.done ? 'due overdue' : isToday(todo.due) ? 'due today' : 'due')
    : '';

  return html`
    <li class="${todo.done ? 'item done' : 'item'}">
      <input
        type="checkbox"
        class="check"
        checked="${todo.done}"
        onChange="${() => toggleTodo(todo.id)}"
      />
      <div class="content">
        <div class="line1">
          <span class="text">${todo.text}</span>
          <span class="priority ${todo.priority}">${LABEL[todo.priority]}</span>
        </div>
        <div class="line2">
          <span class="category">${todo.category}</span>
          ${todo.due ? html`<span class="${dueClass}">${formatDate(todo.due)}</span>` : ''}
        </div>
      </div>
      <div class="actions">
        <button class="mini-btn" onClick="${() => startEdit(todo)}">编辑</button>
        <button class="mini-btn danger" onClick="${() => removeTodo(todo.id)}">删除</button>
      </div>
    </li>
  `;
}
import { html } from '../../../core/index.js';
import { draft, CATEGORIES, PRIORITIES, addTodo } from '../store.js';

export function TodoInput() {
  return html`
    <div class="input-panel">
      <div class="input-main">
        <input
          type="text"
          class="text-input"
          placeholder="要做什么？"
          value="${draft.text}"
          onInput="${e => { draft.text = e.target.value; }}"
          onKeydown="${e => { if (e.key === 'Enter') addTodo(); }}"
        />
        <button class="add-btn" onClick="${addTodo}">添加</button>
      </div>
      <div class="input-meta">
        <select class="meta-select" value="${draft.category}" onChange="${e => { draft.category = e.target.value; }}">
          ${CATEGORIES.map(c => html`<option value="${c}">${c}</option>`)}
        </select>
        <select class="meta-select" value="${draft.priority}" onChange="${e => { draft.priority = e.target.value; }}">
          ${PRIORITIES.map(p => html`<option value="${p.value}">优先级：${p.label}</option>`)}
        </select>
        <input
          type="date"
          class="meta-date"
          value="${draft.due}"
          onInput="${e => { draft.due = e.target.value; }}"
        />
      </div>
    </div>
  `;
}
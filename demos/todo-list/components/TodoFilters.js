import { html } from '/core/index.js';
import { store, CATEGORIES } from '../store.js';

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'done', label: '已完成' }
];

export function TodoFilters() {
  return html`
    <div class="filters">
      <div class="filter-row">
        <input
          type="text"
          class="search"
          placeholder="搜索待办…"
          value="${store.keyword}"
          onInput="${e => { store.keyword = e.target.value; }}"
        />
        <select class="meta-select" value="${store.sortBy}" onChange="${e => { store.sortBy = e.target.value; }}">
          <option value="created">按创建时间</option>
          <option value="priority">按优先级</option>
          <option value="due">按截止日期</option>
        </select>
      </div>
      <div class="filter-row">
        <div class="tabs">
          ${FILTERS.map(f => html`
            <button
              class="${store.filter === f.value ? 'tab active' : 'tab'}"
              onClick="${() => { store.filter = f.value; }}"
            >${f.label}</button>
          `)}
        </div>
        <select class="meta-select" value="${store.category}" onChange="${e => { store.category = e.target.value; }}">
          <option value="all">全部分类</option>
          ${CATEGORIES.map(c => html`<option value="${c}">${c}</option>`)}
        </select>
      </div>
    </div>
  `;
}
import { html } from '../../../core/index.js';
import { stats } from '../store.js';

export function Header() {
  const today = new Date();
  const dateText = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
  const s = stats();

  return html`
    <header class="header">
      <div>
        <h1 class="title">Todo List</h1>
        <span class="date">${dateText}</span>
      </div>
      <div class="stats">
        <span class="stat">共 ${s.total}</span>
        <span class="stat active">进行 ${s.active}</span>
        <span class="stat done">完成 ${s.done}</span>
      </div>
    </header>
  `;
}
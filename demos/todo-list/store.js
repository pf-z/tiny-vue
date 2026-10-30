import { reactive, ref } from '/core/index.js';
import { uid, loadTodos, saveTodos } from './utils.js';

export const CATEGORIES = ['工作', '生活', '学习', '其他'];
export const PRIORITIES = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' }
];

export const store = reactive({
  list: loadTodos(),
  filter: 'all',
  category: 'all',
  keyword: '',
  sortBy: 'created'
});

export const draft = reactive({
  text: '',
  category: '工作',
  priority: 'medium',
  due: ''
});

export const editingId = ref(null);
export const editText = ref('');

export function persist() {
  saveTodos(store.list);
}

export function addTodo() {
  const text = draft.text.trim();
  if (!text) return;
  store.list = [...store.list, {
    id: uid(),
    text,
    done: false,
    category: draft.category,
    priority: draft.priority,
    due: draft.due,
    createdAt: Date.now()
  }];
  draft.text = '';
  draft.due = '';
  persist();
}

export function toggleTodo(id) {
  const item = store.list.find(t => t.id === id);
  if (item) {
    item.done = !item.done;
    persist();
  }
}

export function removeTodo(id) {
  store.list = store.list.filter(t => t.id !== id);
  persist();
}

export function startEdit(todo) {
  editText.value = todo.text;
  editingId.value = todo.id;
}

export function saveEdit(todo) {
  const text = editText.value.trim();
  if (text) {
    todo.text = text;
    persist();
  }
  editingId.value = null;
}

export function cancelEdit() {
  editingId.value = null;
}

export function clearDone() {
  store.list = store.list.filter(t => !t.done);
  persist();
}

export function clearAll() {
  store.list = [];
  persist();
}

const WEIGHT = { high: 0, medium: 1, low: 2 };

export function visibleList() {
  let list = store.list.slice();

  if (store.filter === 'active') list = list.filter(t => !t.done);
  if (store.filter === 'done') list = list.filter(t => t.done);
  if (store.category !== 'all') list = list.filter(t => t.category === store.category);

  const kw = store.keyword.trim().toLowerCase();
  if (kw) list = list.filter(t => t.text.toLowerCase().includes(kw));

  if (store.sortBy === 'priority') {
    list.sort((a, b) => WEIGHT[a.priority] - WEIGHT[b.priority]);
  } else if (store.sortBy === 'due') {
    list.sort((a, b) => {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });
  } else {
    list.sort((a, b) => a.createdAt - b.createdAt);
  }

  return list;
}

export function stats() {
  const total = store.list.length;
  const done = store.list.filter(t => t.done).length;
  return { total, done, active: total - done };
}
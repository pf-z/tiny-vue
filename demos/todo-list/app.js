import { h, createApp } from '/core/index.js';
import { Header } from './components/Header.js';
import { TodoInput } from './components/TodoInput.js';
import { TodoFilters } from './components/TodoFilters.js';
import { TodoList } from './components/TodoList.js';
import { Footer } from './components/Footer.js';

const App = {
  render() {
    return h('div', { id: 'app' }, [
      Header(),
      TodoInput(),
      TodoFilters(),
      h('div', { class: 'list-wrap' }, [TodoList()]),
      Footer()
    ]);
  }
};

createApp(App, document.getElementById('root'));
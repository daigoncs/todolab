import { TodoStore } from './store.js';

const store = new TodoStore();
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const formFeedback = document.querySelector('#form-feedback');
const toggleAll = document.querySelector('#toggle-all');
const clearCompleted = document.querySelector('#clear-completed');
const filters = document.querySelector('#todo-filters');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const filtrosValidos = ['all', 'active', 'completed'];

function obterFiltroDaRota() {
  const filtro = window.location.hash.replace(/^#\/?/, '');
  return filtrosValidos.includes(filtro) ? filtro : 'all';
}

let filtroAtual = obterFiltroDaRota();

function render() {
  const todasAsTarefas = store.listar();
  const tarefas = store.filtrar(filtroAtual);
  list.replaceChildren();
  emptyState.hidden = tarefas.length > 0;
  emptyState.textContent = todasAsTarefas.length === 0
    ? 'Nenhuma tarefa ainda. Comece com um critério claro.'
    : filtroAtual === 'active'
      ? 'Nenhuma tarefa ativa.'
      : filtroAtual === 'completed'
        ? 'Nenhuma tarefa concluída.'
        : 'Nenhuma tarefa ainda. Comece com um critério claro.';
  toggleAll.checked = todasAsTarefas.length > 0 && todasAsTarefas.every((tarefa) => tarefa.concluida);
  toggleAll.disabled = todasAsTarefas.length === 0;
  clearCompleted.disabled = !todasAsTarefas.some((tarefa) => tarefa.concluida);

  for (const link of filters.querySelectorAll('[data-filter]')) {
    if (link.dataset.filter === filtroAtual) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  for (const tarefa of tarefas) {
    const item = document.createElement('li');
    item.className = `todo ${tarefa.concluida ? 'todo--done' : ''}`;
    item.dataset.id = tarefa.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = tarefa.concluida;
    checkbox.setAttribute('aria-label', `Marcar ${tarefa.titulo} como concluída`);
    checkbox.addEventListener('change', () => {
      store.alternar(tarefa.id);
      render();
    });

    const title = document.createElement('span');
    title.textContent = tarefa.titulo;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = 'Remover';
    remove.setAttribute('aria-label', `Remover ${tarefa.titulo}`);
    remove.addEventListener('click', () => {
      store.remover(tarefa.id);
      render();
    });

    item.append(checkbox, title, remove);
    list.append(item);
  }
}

toggleAll.addEventListener('change', () => {
  store.alternarTodas();
  render();
});

window.addEventListener('hashchange', () => {
  filtroAtual = obterFiltroDaRota();
  render();
});

clearCompleted.addEventListener('click', () => {
  store.limparConcluidas();
  render();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formFeedback.textContent = '';
  formFeedback.className = 'form-feedback';

  try {
    const tarefa = store.adicionar(input.value);
    if (!tarefa) {
      formFeedback.textContent = 'Digite uma tarefa antes de adicionar.';
      formFeedback.classList.add('form-feedback--error');
      input.focus();
      return;
    }

    formFeedback.textContent = `Tarefa "${tarefa.titulo}" salva com sucesso.`;
    formFeedback.classList.add('form-feedback--success');
    input.value = '';
    input.focus();
    render();
  } catch {
    formFeedback.textContent = 'Não foi possível salvar a tarefa. O texto continua no campo; tente novamente.';
    formFeedback.classList.add('form-feedback--error');
    input.focus();
  }
});

render();

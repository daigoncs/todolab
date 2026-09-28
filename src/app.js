import { TodoStore } from './store.js';

const store = new TodoStore();
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const formFeedback = document.querySelector('#form-feedback');
const toggleAll = document.querySelector('#toggle-all');
const clearCompleted = document.querySelector('#clear-completed');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');

function render() {
  const tarefas = store.listar();
  list.replaceChildren();
  emptyState.hidden = tarefas.length > 0;
  toggleAll.checked = tarefas.length > 0 && tarefas.every((tarefa) => tarefa.concluida);
  toggleAll.disabled = tarefas.length === 0;
  clearCompleted.disabled = !tarefas.some((tarefa) => tarefa.concluida);

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

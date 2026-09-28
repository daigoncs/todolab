import { TodoStore } from './store.js';

const store = new TodoStore();
const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
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
    title.addEventListener('dblclick', () => {
      const editor = document.createElement('input');
      editor.type = 'text';
      editor.className = 'todo__edit';
      editor.value = tarefa.titulo;
      editor.setAttribute('aria-label', `Editar ${tarefa.titulo}`);
      let finalizada = false;

      const finalizar = (salvar) => {
        if (finalizada) return;
        finalizada = true;

        if (salvar) {
          const tarefaAtualizada = store.editar(tarefa.id, editor.value);
          title.textContent = tarefaAtualizada?.titulo ?? tarefa.titulo;
          checkbox.setAttribute('aria-label', `Marcar ${title.textContent} como concluída`);
          remove.setAttribute('aria-label', `Remover ${title.textContent}`);
        }

        item.replaceChild(title, editor);
      };

      editor.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finalizar(true);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          finalizar(false);
        }
      });
      editor.addEventListener('blur', () => finalizar(true));
      item.replaceChild(editor, title);
      editor.focus();
      editor.select();
    });

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
  const tarefa = store.adicionar(input.value);
  if (!tarefa) return;
  input.value = '';
  input.focus();
  render();
});

render();

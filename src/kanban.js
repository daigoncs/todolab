const ETAPAS = [
  { titulo: 'Novo', status: 'novo' },
  { titulo: 'Em Progresso', status: 'em-progresso' },
  { titulo: 'Em Revisão', status: 'em-revisao' },
  { titulo: 'Concluído', status: 'concluido' },
];

export function renderizarColunasKanban(container, tarefas = []) {
  const documento = container.ownerDocument;
  const colunas = ETAPAS.map(({ titulo, status }) => {
    const coluna = documento.createElement('section');
    coluna.className = 'kanban-column';
    coluna.dataset.status = status;
    coluna.setAttribute('aria-label', titulo);

    const cabecalho = documento.createElement('h3');
    cabecalho.className = 'kanban-column__title';
    cabecalho.textContent = titulo;
    const lista = documento.createElement('ul');
    lista.className = 'kanban-column__tasks';
    lista.setAttribute('aria-label', `Tarefas: ${titulo}`);

    for (const tarefa of tarefas) {
      if (tarefa.status !== status) continue;
      const item = documento.createElement('li');
      item.className = 'kanban-card';
      item.dataset.id = tarefa.id;
      item.textContent = tarefa.titulo;
      lista.append(item);
    }

    coluna.append(cabecalho, lista);

    return coluna;
  });

  container.replaceChildren(...colunas);
  return colunas;
}

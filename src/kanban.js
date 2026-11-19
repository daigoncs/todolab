const ETAPAS = [
  { titulo: 'Novo', status: 'novo' },
  { titulo: 'Em Progresso', status: 'em-progresso' },
  { titulo: 'Em Revisão', status: 'em-revisao' },
  { titulo: 'Concluído', status: 'concluido' },
];

export function renderizarColunasKanban(
  container,
  tarefas = [],
  aoAlterarStatus = null,
) {
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

      if (typeof aoAlterarStatus === 'function') {
        const seletor = documento.createElement('select');
        seletor.setAttribute(
          'aria-label',
          `Alterar status de ${tarefa.titulo}`,
        );

        for (const etapa of ETAPAS) {
          const opcao = documento.createElement('option');
          opcao.value = etapa.status;
          opcao.textContent = etapa.titulo;
          opcao.selected = etapa.status === tarefa.status;
          seletor.append(opcao);
        }

        seletor.value = tarefa.status;

        seletor.addEventListener('change', () => {
          aoAlterarStatus(tarefa.id, seletor.value);
        });

        item.append(seletor);
      }

      lista.append(item);
    }

    coluna.append(cabecalho, lista);
    return coluna;
  });

  container.replaceChildren(...colunas);

  return colunas;
}
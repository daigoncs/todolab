const ETAPAS = [
  { titulo: 'Novo', status: 'novo' },
  { titulo: 'Em Progresso', status: 'em-progresso' },
  { titulo: 'Em Revisão', status: 'em-revisao' },
  { titulo: 'Concluído', status: 'concluido' },
];

export function renderizarColunasKanban(container) {
  const documento = container.ownerDocument;
  const colunas = ETAPAS.map(({ titulo, status }) => {
    const coluna = documento.createElement('section');
    coluna.className = 'kanban-column';
    coluna.dataset.status = status;
    coluna.setAttribute('aria-label', titulo);

    const cabecalho = documento.createElement('h3');
    cabecalho.className = 'kanban-column__title';
    cabecalho.textContent = titulo;
    coluna.append(cabecalho);

    return coluna;
  });

  container.replaceChildren(...colunas);
  return colunas;
}

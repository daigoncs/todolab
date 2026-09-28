const CHAVE = 'todolab:tarefas';

function criarTarefa(titulo) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    titulo,
    concluida: false,
    criadaEm: new Date().toISOString(),
  };
}

export class TodoStore {
  constructor(armazenamento = globalThis.localStorage) {
    this.armazenamento = armazenamento;
    this.tarefas = this.carregar();
  }

  carregar() {
    if (!this.armazenamento) return [];
    try {
      const bruto = this.armazenamento.getItem(CHAVE);
      if (!bruto) return [];
      const tarefas = JSON.parse(bruto);
      if (!Array.isArray(tarefas)) return [];
      const tarefasValidas = tarefas.every((tarefa) =>
        tarefa &&
        typeof tarefa === 'object' &&
        !Array.isArray(tarefa) &&
        typeof tarefa.id === 'string' &&
        tarefa.id.length > 0 &&
        typeof tarefa.titulo === 'string' &&
        tarefa.titulo.trim().length > 0 &&
        typeof tarefa.concluida === 'boolean' &&
        typeof tarefa.criadaEm === 'string' &&
        tarefa.criadaEm.length > 0,
      );
      return tarefasValidas ? tarefas : [];
    } catch {
      return [];
    }
  }

  salvar() {
    if (!this.armazenamento) return;
    try {
      this.armazenamento.setItem(CHAVE, JSON.stringify(this.tarefas));
    } catch {}
  }

  listar() {
    return [...this.tarefas];
  }

  adicionar(titulo) {
    if (!titulo) return null;
    titulo = titulo.trim();
    if (!titulo) return null;
    const tarefa = criarTarefa(titulo);
    this.tarefas.push(tarefa);
    this.salvar();
    return tarefa;
  }

  alternar(id) {
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return;
    tarefa.concluida = !tarefa.concluida;
    this.salvar();
  }

  alternarTodas() {
    if (this.tarefas.length === 0) return;
    const marcarComoConcluidas = !this.tarefas.every((tarefa) => tarefa.concluida);
    for (const tarefa of this.tarefas) {
      tarefa.concluida = marcarComoConcluidas;
    }
    this.salvar();
  }

  remover(id) {
    const indice = this.tarefas.findIndex((tarefa) => tarefa.id === id);
    if (indice === -1) return;
    this.tarefas.splice(indice, 1);
    this.salvar();
  }
}

const CHAVE = 'todolab:tarefas';
const STATUS_VALIDOS = ['novo', 'em-progresso', 'em-revisao', 'concluido'];

function criarTarefa(titulo) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    status: 'novo',
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
      return tarefasValidas
        ? tarefas.map((tarefa) => ({
          ...tarefa,
          status: typeof tarefa.status === 'string' && tarefa.status.length > 0
            ? tarefa.status
            : 'novo',
        }))
        : [];
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

  filtrar(filtro = 'all') {
    if (filtro === 'active') return this.tarefas.filter((tarefa) => !tarefa.concluida);
    if (filtro === 'completed') return this.tarefas.filter((tarefa) => tarefa.concluida);
    return this.listar();
  }

  adicionar(titulo) {
    if (typeof titulo !== 'string') return null;
    const tituloTratado = titulo.trim();
    if (!tituloTratado) return null;
    const tarefa = criarTarefa(tituloTratado);
    this.tarefas.push(tarefa);
    try {
      this.salvar();
    } catch (erro) {
      this.tarefas.pop();
      throw erro;
    }
    return tarefa;
  }

  editar(id, titulo) {
    if (typeof titulo !== 'string') return null;
    const tituloTratado = titulo.trim();
    if (!tituloTratado) return null;
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return null;
    if (tarefa.titulo === tituloTratado) return tarefa;
    tarefa.titulo = tituloTratado;
    this.salvar();
    return tarefa;
  }

  atualizarStatus(id, status) {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new RangeError(`Status inválido. Valores permitidos: ${STATUS_VALIDOS.join(', ')}.`);
    }
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return null;
    if (tarefa.status === status) return tarefa;
    tarefa.status = status;
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

  limparConcluidas() {
    const tarefasPendentes = this.tarefas.filter((tarefa) => !tarefa.concluida);
    const removidas = this.tarefas.length - tarefasPendentes.length;
    if (removidas === 0) return 0;
    this.tarefas = tarefasPendentes;
    this.salvar();
    return removidas;
  }

  remover(id) {
    const indice = this.tarefas.findIndex((tarefa) => tarefa.id === id);
    if (indice === -1) return;
    this.tarefas.splice(indice, 1);
    this.salvar();
  }
}

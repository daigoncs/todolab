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
    const bruto = this.armazenamento.getItem(CHAVE);
    if (!bruto) return [];
    return JSON.parse(bruto);
  }

  salvar() {
    if (!this.armazenamento) return;
    this.armazenamento.setItem(CHAVE, JSON.stringify(this.tarefas));
  }

  listar() {
    return [...this.tarefas];
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

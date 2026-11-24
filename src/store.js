const CHAVE = "todolab:tarefas";
const STATUS_VALIDOS = ["novo", "em-progresso", "em-revisao", "concluido"];
const PRIORIDADES_VALIDAS = ["baixa", "media", "média", "alta"];

function normalizarPrioridade(prioridade) {
  if (typeof prioridade !== "string") return "média";
  const valor = prioridade.trim().toLowerCase();
  if (!PRIORIDADES_VALIDAS.includes(valor)) return "média";
  return valor === "media" ? "média" : valor;
}

function normalizarPrazo(prazo) {
  if (typeof prazo !== "string") return null;
  const valor = prazo.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  )
    return null;
  return valor;
}

function criarTarefa(titulo, prioridade = "média", prazo = null) {
  if (
    prioridade &&
    typeof prioridade === "object" &&
    !Array.isArray(prioridade)
  ) {
    prazo = prioridade.prazo ?? prioridade.deadline ?? null;
    prioridade = prioridade.prioridade ?? "média";
  }
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    status: "novo",
    titulo,
    prioridade: normalizarPrioridade(prioridade),
    prazo: normalizarPrazo(prazo),
    concluida: false,
    criadaEm: new Date().toISOString(),
  };
}

function executarAlteracao(store, alterar) {
  const listaAnterior = store.tarefas;
  const tarefasAnteriores = listaAnterior.map((tarefa) => ({
    tarefa,
    valores: { ...tarefa },
  }));

  try {
    const resultado = alterar();
    store.salvar();
    return resultado;
  } catch (erro) {
    for (const { tarefa, valores } of tarefasAnteriores) {
      for (const chave of Object.keys(tarefa)) {
        if (!Object.prototype.hasOwnProperty.call(valores, chave)) {
          delete tarefa[chave];
        }
      }
      Object.assign(tarefa, valores);
    }
    store.tarefas = listaAnterior;
    listaAnterior.splice(
      0,
      listaAnterior.length,
      ...tarefasAnteriores.map(({ tarefa }) => tarefa),
    );
    throw erro;
  }
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
      const tarefasValidas = tarefas.every(
        (tarefa) =>
          tarefa &&
          typeof tarefa === "object" &&
          !Array.isArray(tarefa) &&
          typeof tarefa.id === "string" &&
          tarefa.id.length > 0 &&
          typeof tarefa.titulo === "string" &&
          tarefa.titulo.trim().length > 0 &&
          typeof tarefa.concluida === "boolean" &&
          typeof tarefa.criadaEm === "string" &&
          tarefa.criadaEm.length > 0,
      );
      return tarefasValidas
        ? tarefas.map((tarefa) => {
            const statusSalvo =
              typeof tarefa.status === "string" ? tarefa.status.trim() : "";
            return {
              ...tarefa,
              status: statusSalvo || "novo",
              prioridade: normalizarPrioridade(tarefa.prioridade),
              prazo: normalizarPrazo(tarefa.prazo),
            };
          })
        : [];
    } catch {
      return [];
    }
  }

  salvar() {
    if (!this.armazenamento) return true;
    try {
      this.armazenamento.setItem(CHAVE, JSON.stringify(this.tarefas));
      return true;
    } catch {
      return false;
    }
  }

  listar() {
    return [...this.tarefas];
  }

  filtrar(filtro = "all") {
    if (filtro === "active")
      return this.tarefas.filter((tarefa) => !tarefa.concluida);
    if (filtro === "completed")
      return this.tarefas.filter((tarefa) => tarefa.concluida);
    return this.listar();
  }

  adicionar(titulo, prioridade = "média", prazo = null) {
    if (typeof titulo !== "string") return null;
    const tituloTratado = titulo.trim();
    if (!tituloTratado) return null;
    const tarefa = criarTarefa(tituloTratado, prioridade, prazo);
    this.tarefas.push(tarefa);
    try {
      if (!this.salvar()) throw new Error("Falha ao salvar tarefa.");
    } catch (erro) {
      this.tarefas.pop();
      throw erro;
    }
    return tarefa;
  }

  editar(id, titulo) {
    if (typeof titulo !== "string") return null;
    const tituloTratado = titulo.trim();
    if (!tituloTratado) return null;
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return null;
    if (tarefa.titulo === tituloTratado) return tarefa;
    return executarAlteracao(this, () => {
      tarefa.titulo = tituloTratado;
      return tarefa;
    });
  }

  atualizarStatus(id, status) {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new RangeError(
        `Status inválido. Valores permitidos: ${STATUS_VALIDOS.join(", ")}.`,
      );
    }
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return null;
    if (tarefa.status === status) return tarefa;
    const statusAnterior = tarefa.status;
    tarefa.status = status;
    try {
      if (!this.salvar()) throw new Error("Falha ao salvar status da tarefa.");
    } catch (erro) {
      tarefa.status = statusAnterior;
      throw erro;
    }
    return tarefa;
  }

  alternar(id) {
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return;
    executarAlteracao(this, () => {
      tarefa.concluida = !tarefa.concluida;
    });
  }

  alternarTodas() {
    if (this.tarefas.length === 0) return;
    const marcarComoConcluidas = !this.tarefas.every(
      (tarefa) => tarefa.concluida,
    );
    executarAlteracao(this, () => {
      for (const tarefa of this.tarefas) {
        tarefa.concluida = marcarComoConcluidas;
      }
    });
  }

  limparConcluidas() {
    const tarefasPendentes = this.tarefas.filter((tarefa) => !tarefa.concluida);
    const removidas = this.tarefas.length - tarefasPendentes.length;
    if (removidas === 0) return 0;
    return executarAlteracao(this, () => {
      this.tarefas = tarefasPendentes;
      return removidas;
    });
  }

  remover(id) {
    const indice = this.tarefas.findIndex((tarefa) => tarefa.id === id);
    if (indice === -1) return;
    executarAlteracao(this, () => {
      this.tarefas.splice(indice, 1);
    });
  }

  estaAtrasada(tarefaOuId, hoje) {
    const tarefa =
      typeof tarefaOuId === "string"
        ? this.tarefas.find((item) => item.id === tarefaOuId)
        : tarefaOuId;
    if (!tarefa || tarefa.concluida || !tarefa.prazo) return false;

    let hojeISO;
    if (typeof hoje === "string" && /^\d{4}-\d{2}-\d{2}$/.test(hoje)) {
      hojeISO = hoje;
    } else {
      const agora =
        hoje instanceof Date && !Number.isNaN(hoje.getTime())
          ? hoje
          : new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, "0");
      const dia = String(agora.getDate()).padStart(2, "0");
      hojeISO = `${ano}-${mes}-${dia}`;
    }
    return normalizarPrazo(tarefa.prazo) !== null && tarefa.prazo < hojeISO;
  }
}

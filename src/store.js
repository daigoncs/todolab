const CHAVE = "todolab:tarefas";
const CHAVE_AUDITORIA = "todolab:auditoria";
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
  const eventosAnteriores = store.eventosAuditoria.map((evento) => ({
    ...evento,
    detalhes: { ...evento.detalhes },
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
    store.eventosAuditoria = eventosAnteriores;
    store.salvar();
    store.salvarAuditoria();
    throw erro;
  }
}

export class TodoStore {
  constructor(armazenamento = globalThis.localStorage) {
    this.armazenamento = armazenamento;
    this.tarefas = this.carregar();
    this.eventosAuditoria = this.carregarAuditoria();
    this.contextoAuditoria = {
      autor: "usuario",
      origem: "usuario",
    };
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
      this.registrarEvento(tarefa.id, "criar", {
        titulo: tarefa.titulo,
        prioridade: tarefa.prioridade,
        prazo: tarefa.prazo,
      });
    } catch (erro) {
      this.tarefas.pop();
      this.salvar();
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
    const tituloAnterior = tarefa.titulo;
    return executarAlteracao(this, () => {
      tarefa.titulo = tituloTratado;
      this.registrarEvento(tarefa.id, "editar", {
        tituloAnterior,
        tituloNovo: tituloTratado,
      });
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
    const eventosAnteriores = this.eventosAuditoria.map((evento) => ({
      ...evento,
      detalhes: { ...evento.detalhes },
    }));
    tarefa.status = status;
    try {
      if (!this.salvar()) throw new Error("Falha ao salvar status da tarefa.");
      this.registrarEvento(tarefa.id, "alterar_status", {
        statusAnterior,
        statusNovo: status,
      });
    } catch (erro) {
      tarefa.status = statusAnterior;
      this.eventosAuditoria = eventosAnteriores;
      this.salvar();
      this.salvarAuditoria();
      throw erro;
    }
    return tarefa;
  }

  alternar(id) {
    const tarefa = this.tarefas.find((item) => item.id === id);
    if (!tarefa) return;
    executarAlteracao(this, () => {
      tarefa.concluida = !tarefa.concluida;
      this.registrarEvento(tarefa.id, "alterar_conclusao", {
        concluida: tarefa.concluida,
      });
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
        this.registrarEvento(tarefa.id, "alterar_conclusao", {
          concluida: marcarComoConcluidas,
          origemOperacao: "alternar_todas",
        });
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
    const tarefaRemovida = this.tarefas[indice];
    executarAlteracao(this, () => {
      this.registrarEvento(tarefaRemovida.id, "excluir", {
        titulo: tarefaRemovida.titulo,
        status: tarefaRemovida.status,
        prioridade: tarefaRemovida.prioridade,
        prazo: tarefaRemovida.prazo,
      });
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

  carregarAuditoria() {
    if (!this.armazenamento) return [];
    try {
      const bruto = this.armazenamento.getItem(CHAVE_AUDITORIA);
      if (!bruto) return [];
      return normalizarEventos(JSON.parse(bruto));
    } catch {
      return [];
    }
  }

  salvarAuditoria() {
    if (!this.armazenamento) return true;
    try {
      this.armazenamento.setItem(
        CHAVE_AUDITORIA,
        JSON.stringify(this.eventosAuditoria),
      );
      return true;
    } catch {
      return false;
    }
  }

  configurarAuditoria(autor = "usuario", origem = "usuario") {
    this.contextoAuditoria = {
      autor:
        typeof autor === "string" && autor.trim() ? autor.trim() : "usuario",
      origem: origem === "ia" ? "ia" : "usuario",
    };
  }

  registrarEvento(tarefaId, operacao, detalhes = {}, contexto = null) {
    if (
      typeof tarefaId !== "string" ||
      tarefaId.length === 0 ||
      typeof operacao !== "string" ||
      operacao.trim().length === 0
    )
      return null;

    const contextoAtual =
      contexto && typeof contexto === "object"
        ? contexto
        : this.contextoAuditoria;
    const evento = criarEventoAuditoria(
      tarefaId,
      operacao.trim(),
      contextoAtual.autor,
      contextoAtual.origem,
      detalhes,
    );
    this.eventosAuditoria.push(evento);
    if (!this.salvarAuditoria()) {
      this.eventosAuditoria.pop();
      throw new Error("Falha ao salvar registro de auditoria.");
    }
    return evento;
  }

  listarHistorico(tarefaId) {
    if (typeof tarefaId !== "string" || tarefaId.length === 0) return [];
    return normalizarEventos(
      this.eventosAuditoria.filter((evento) => evento.tarefaId === tarefaId),
    ).map((evento) => ({ ...evento, detalhes: { ...evento.detalhes } }));
  }
}

function criarEventoAuditoria(
  tarefaId,
  operacao,
  autor = "usuario",
  origem = "usuario",
  detalhes = {},
) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    tarefaId,
    operacao,
    autor: typeof autor === "string" && autor.trim() ? autor.trim() : "usuario",
    origem: origem === "ia" ? "ia" : "usuario",
    dataHora: new Date().toISOString(),
    detalhes:
      detalhes && typeof detalhes === "object" && !Array.isArray(detalhes)
        ? { ...detalhes }
        : {},
  };
}

function normalizarEventos(eventos) {
  if (!Array.isArray(eventos)) return [];
  return eventos
    .filter(
      (evento) =>
        evento &&
        typeof evento === "object" &&
        typeof evento.id === "string" &&
        typeof evento.tarefaId === "string" &&
        typeof evento.operacao === "string" &&
        typeof evento.dataHora === "string",
    )
    .map((evento) => ({
      ...evento,
      autor:
        typeof evento.autor === "string" && evento.autor.trim()
          ? evento.autor.trim()
          : "usuario",
      origem: evento.origem === "ia" ? "ia" : "usuario",
      detalhes:
        evento.detalhes &&
        typeof evento.detalhes === "object" &&
        !Array.isArray(evento.detalhes)
          ? { ...evento.detalhes }
          : {},
    }))
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}

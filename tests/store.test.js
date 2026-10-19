import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TodoStore } from '../src/store.js';

export function testarAdicionarTarefa() {
  const dados = new Map();
  const armazenamento = {
    getItem(chave) {
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
    },
  };
  const store = new TodoStore(armazenamento);

  for (const titulo of ['', '   ', '\t\t', ' \t\n ']) {
    const antes = store.listar();
    const persistidoAntes = dados.get('todolab:tarefas');

    assert.equal(store.adicionar(titulo), null, `deve rejeitar ${JSON.stringify(titulo)}`);
    assert.deepEqual(store.listar(), antes, 'a lista não deve ser alterada');
    assert.equal(dados.get('todolab:tarefas'), persistidoAntes, 'não deve persistir uma tarefa inválida');
  }

  const tarefa = store.adicionar('  revisar requisitos\t ');
  assert.ok(tarefa, 'deve criar tarefa com conteúdo válido');
  assert.equal(tarefa.titulo, 'revisar requisitos', 'deve remover espaços externos');
  assert.deepEqual(store.listar(), [tarefa]);
  assert.deepEqual(JSON.parse(dados.get('todolab:tarefas')), [tarefa]);

  const armazenamentoComFalha = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error('falha simulada de persistência');
    },
  };
  const storeComFalha = new TodoStore(armazenamentoComFalha);
  assert.throws(() => storeComFalha.adicionar('não perder este texto'), /falha simulada/);
  assert.deepEqual(storeComFalha.listar(), [], 'falha ao salvar deve desfazer a inclusão na memória');
}

test('adicionar rejeita títulos vazios e normaliza títulos válidos', testarAdicionarTarefa);

export function testarStatusPadraoDaTarefa() {
  const dados = new Map();
  const armazenamento = {
    getItem(chave) {
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
    },
  };
  const store = new TodoStore(armazenamento);

  const tarefa = store.adicionar('  tarefa com status  ');
  assert.equal(tarefa.status, 'novo', 'nova tarefa deve receber o status padrão');
  assert.equal(tarefa.titulo, 'tarefa com status', 'o título deve permanecer normalizado');
  assert.equal(tarefa.concluida, false, 'o estado de conclusão deve ser preservado');
  assert.equal(typeof tarefa.id, 'string', 'o identificador deve continuar presente');
  assert.ok(tarefa.criadaEm, 'a data de criação deve continuar presente');
  assert.deepEqual(store.listar(), [tarefa], 'a tarefa deve continuar disponível para exibição');
  assert.deepEqual(JSON.parse(dados.get('todolab:tarefas')), [tarefa], 'o status deve ser persistido');
  assert.deepEqual(
    new TodoStore(armazenamento).listar(),
    [tarefa],
    'status e demais campos devem permanecer após recarga',
  );

  const tarefaLegada = {
    id: 'legada-1',
    titulo: 'Tarefa antiga',
    concluida: true,
    criadaEm: '2026-01-01T00:00:00.000Z',
    metadado: 'preservado',
  };
  dados.set('todolab:tarefas', JSON.stringify([tarefaLegada]));
  const storeComTarefaLegada = new TodoStore(armazenamento);
  assert.deepEqual(storeComTarefaLegada.listar(), [{
    ...tarefaLegada,
    status: 'novo',
  }], 'tarefa legada deve receber status sem perder dados existentes');
  assert.deepEqual(
    storeComTarefaLegada.filtrar('all'),
    storeComTarefaLegada.listar(),
    'tarefas com status devem continuar listáveis',
  );

  const tarefaComStatus = { ...tarefaLegada, status: 'em andamento' };
  dados.set('todolab:tarefas', JSON.stringify([tarefaComStatus]));
  assert.deepEqual(
    new TodoStore(armazenamento).listar(),
    [tarefaComStatus],
    'um status já existente deve ser preservado',
  );

  for (const titulo of ['', '   ', null, 42]) {
    const antes = store.listar();
    assert.equal(store.adicionar(titulo), null, 'entrada inválida não deve criar tarefa');
    assert.deepEqual(store.listar(), antes, 'entrada inválida não deve alterar a lista');
  }
}

test('tarefas recebem status padrão sem perder dados ou interromper a listagem', testarStatusPadraoDaTarefa);

export function testarValidacaoDeStatus() {
  const dados = new Map();
  let gravacoes = 0;
  const armazenamento = {
    getItem(chave) {
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
      gravacoes += 1;
    },
  };
  const store = new TodoStore(armazenamento);
  const tarefa = store.adicionar('Validar status');

  for (const status of ['novo', 'em-progresso', 'em-revisao', 'concluido']) {
    assert.equal(store.atualizarStatus(tarefa.id, status), tarefa, `deve aceitar ${status}`);
    assert.equal(tarefa.status, status, `deve definir ${status}`);
    assert.deepEqual(
      JSON.parse(dados.get('todolab:tarefas')),
      [tarefa],
      `deve persistir o status ${status}`,
    );
  }

  for (const status of ['cancelado', '', 'EM-PROGRESSO', ' em-progresso ', null, 42]) {
    const statusAnterior = tarefa.status;
    const gravacoesAntes = gravacoes;
    assert.throws(
      () => store.atualizarStatus(tarefa.id, status),
      (erro) => erro instanceof RangeError && /novo, em-progresso, em-revisao, concluido/.test(erro.message),
      `deve rejeitar ${JSON.stringify(status)} e informar os valores permitidos`,
    );
    assert.equal(tarefa.status, statusAnterior, 'status inválido não deve substituir o válido');
    assert.equal(gravacoes, gravacoesAntes, 'status inválido não deve ser persistido');
  }

  const gravacoesAntesDeIdInexistente = gravacoes;
  assert.equal(store.atualizarStatus('id-inexistente', 'concluido'), null);
  assert.equal(gravacoes, gravacoesAntesDeIdInexistente, 'tarefa inexistente não deve gravar alteração');
}

test('atualizarStatus aceita apenas os quatro valores permitidos', testarValidacaoDeStatus);

export function testarPersistenciaDeStatus() {
  const dados = new Map();
  const armazenamento = {
    getItem(chave) {
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
    },
  };
  const store = new TodoStore(armazenamento);
  const tarefa = store.adicionar('Tarefa com dados preservados');
  tarefa.descricao = 'Descrição original';
  store.atualizarStatus(tarefa.id, 'em-progresso');

  for (const status of ['novo', 'em-progresso', 'em-revisao', 'concluido']) {
    store.atualizarStatus(tarefa.id, status);
    const tarefaSalva = JSON.parse(dados.get('todolab:tarefas'))[0];

    assert.equal(tarefaSalva.status, status, `deve salvar o status ${status}`);
    assert.equal(tarefaSalva.titulo, 'Tarefa com dados preservados');
    assert.equal(tarefaSalva.descricao, 'Descrição original');
    assert.equal(tarefaSalva.id, tarefa.id);
    assert.equal(tarefaSalva.concluida, tarefa.concluida);
    assert.equal(tarefaSalva.criadaEm, tarefa.criadaEm);

    const storeRecarregada = new TodoStore(armazenamento);
    assert.deepEqual(
      storeRecarregada.listar(),
      [tarefaSalva],
      `deve recuperar status e demais dados após recarga (${status})`,
    );
  }

  const tarefaAntiga = {
    id: 'tarefa-antiga',
    titulo: 'Tarefa legada',
    descricao: 'Descrição legada',
    concluida: false,
    criadaEm: '2026-01-01T00:00:00.000Z',
  };
  dados.set('todolab:tarefas', JSON.stringify([tarefaAntiga]));

  assert.deepEqual(
    new TodoStore(armazenamento).listar(),
    [{ ...tarefaAntiga, status: 'novo' }],
    'deve carregar tarefa legada sem erro e atribuir status novo',
  );
}

test('status e demais dados persistem após recarga e tarefas legadas são carregadas', testarPersistenciaDeStatus);

export function testarEdicaoDeTarefa() {
  const dados = new Map();
  let gravacoes = 0;
  const armazenamento = {
    getItem(chave) {
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
      gravacoes += 1;
    },
  };
  const store = new TodoStore(armazenamento);
  const tarefa = store.adicionar('Título original');
  const gravacoesAntesDaEdicao = gravacoes;

  const atualizada = store.editar(tarefa.id, '  Título corrigido\t ');
  assert.equal(atualizada, tarefa, 'deve atualizar a tarefa identificada');
  assert.equal(tarefa.titulo, 'Título corrigido', 'deve remover espaços externos do novo título');
  assert.equal(gravacoes, gravacoesAntesDaEdicao + 1, 'deve persistir a alteração válida');
  assert.deepEqual(JSON.parse(dados.get('todolab:tarefas')), [tarefa]);
  assert.deepEqual(new TodoStore(armazenamento).listar(), [tarefa], 'a edição deve persistir após recarga');

  for (const titulo of ['', '   ', '\t\n ', null, 42]) {
    const tituloAntes = tarefa.titulo;
    const gravacoesAntes = gravacoes;
    assert.equal(store.editar(tarefa.id, titulo), null, `deve rejeitar ${JSON.stringify(titulo)}`);
    assert.equal(tarefa.titulo, tituloAntes, 'entrada inválida deve manter o texto anterior');
    assert.equal(gravacoes, gravacoesAntes, 'entrada inválida não deve persistir');
  }

  const gravacoesAntesDeIdInexistente = gravacoes;
  assert.equal(store.editar('id-inexistente', 'Outro título'), null);
  assert.equal(gravacoes, gravacoesAntesDeIdInexistente, 'ID inexistente não deve persistir');

  const gravacoesAntesDoMesmoTitulo = gravacoes;
  assert.equal(store.editar(tarefa.id, ' Título corrigido '), tarefa);
  assert.equal(gravacoes, gravacoesAntesDoMesmoTitulo, 'mesmo título normalizado não precisa ser gravado novamente');
}

test('editar atualiza e persiste títulos válidos sem perder o original em entradas inválidas', testarEdicaoDeTarefa);

export function testarRemocaoDeTarefas() {
  const dados = new Map();
  const armazenamento = {
    getItem(chave) {
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
    },
  };
  const store = new TodoStore(armazenamento);
  const primeira = store.adicionar('Primeira tarefa');
  const segunda = store.adicionar('Segunda tarefa');

  store.remover(primeira.id);
  assert.deepEqual(store.listar(), [segunda], 'deve remover somente a tarefa selecionada');
  assert.deepEqual(JSON.parse(dados.get('todolab:tarefas')), [segunda], 'deve persistir a remoção');
  assert.deepEqual(new TodoStore(armazenamento).listar(), [segunda], 'remoção deve persistir após recarga');

  store.remover('id-inexistente');
  assert.deepEqual(store.listar(), [segunda], 'id inexistente não deve alterar a lista');
}

test('remover exclui a tarefa correta e mantém o resultado após recarga', testarRemocaoDeTarefas);

export function testarAlternanciaGlobalDeTarefas() {
  let dadosSalvos = null;
  let gravacoes = 0;
  const armazenamento = {
    getItem() {
      return dadosSalvos;
    },
    setItem(chave, valor) {
      dadosSalvos = valor;
      gravacoes += 1;
    },
  };
  const storeVazia = new TodoStore(armazenamento);

  storeVazia.alternarTodas();
  assert.deepEqual(storeVazia.listar(), [], 'lista vazia deve continuar sem tarefas');
  assert.equal(gravacoes, 0, 'lista vazia não deve gravar no armazenamento');

  const store = new TodoStore(armazenamento);
  const primeira = store.adicionar('Tarefa 1');
  const segunda = store.adicionar('Tarefa 2');
  const terceira = store.adicionar('Tarefa 3');
  store.alternar(segunda.id);
  const gravacoesAntesDaAlternancia = gravacoes;

  store.alternarTodas();
  assert.ok(store.listar().every((tarefa) => tarefa.concluida), 'lista mista deve ficar toda concluída');
  assert.equal(gravacoes, gravacoesAntesDaAlternancia + 1, 'deve persistir a alternância em uma gravação');
  assert.deepEqual(JSON.parse(dadosSalvos), store.listar(), 'deve persistir todas as tarefas concluídas');

  const storeAposRecarga = new TodoStore(armazenamento);
  assert.ok(storeAposRecarga.listar().every((tarefa) => tarefa.concluida), 'estado concluído deve persistir após recarga');

  storeAposRecarga.alternarTodas();
  assert.ok(storeAposRecarga.listar().every((tarefa) => !tarefa.concluida), 'lista toda concluída deve voltar a pendente');
  assert.deepEqual(JSON.parse(dadosSalvos), storeAposRecarga.listar(), 'deve persistir todas as tarefas pendentes');

  let dadosUnitarios = null;
  const armazenamentoUnitario = {
    getItem() {
      return dadosUnitarios;
    },
    setItem(chave, valor) {
      dadosUnitarios = valor;
    },
  };
  const storeUnitario = new TodoStore(armazenamentoUnitario);
  const tarefaUnica = storeUnitario.adicionar('Tarefa única');
  storeUnitario.alternarTodas();
  assert.equal(storeUnitario.listar()[0].concluida, true, 'deve concluir uma lista com uma tarefa');
  storeUnitario.alternarTodas();
  assert.equal(storeUnitario.listar()[0].concluida, false, 'deve reabrir uma lista com uma tarefa');
  assert.equal(storeUnitario.listar()[0].id, tarefaUnica.id);
}

test('alternarTodas conclui listas mistas e reabre listas concluídas com persistência', testarAlternanciaGlobalDeTarefas);

export function testarLimparTarefasConcluidas() {
  let dadosSalvos = null;
  let gravacoes = 0;
  const armazenamento = {
    getItem() {
      return dadosSalvos;
    },
    setItem(chave, valor) {
      dadosSalvos = valor;
      gravacoes += 1;
    },
  };
  const store = new TodoStore(armazenamento);
  const primeira = store.adicionar('Concluída 1');
  const pendente = store.adicionar('Pendente');
  const segunda = store.adicionar('Concluída 2');
  store.alternar(primeira.id);
  store.alternar(segunda.id);

  assert.equal(store.limparConcluidas(), 2, 'deve retornar a quantidade de tarefas removidas');
  assert.deepEqual(store.listar(), [pendente], 'deve manter somente as tarefas pendentes');
  assert.deepEqual(JSON.parse(dadosSalvos), [pendente], 'deve persistir somente as pendentes');
  assert.deepEqual(new TodoStore(armazenamento).listar(), [pendente], 'o resultado deve persistir após recarga');

  const gravacoesAposLimpeza = gravacoes;
  assert.equal(store.limparConcluidas(), 0, 'sem tarefas concluídas, não deve remover nada');
  assert.equal(gravacoes, gravacoesAposLimpeza, 'sem remoções, não deve gravar no armazenamento');

  const storeVazia = new TodoStore(armazenamentoSemDados());
  assert.equal(storeVazia.limparConcluidas(), 0, 'lista vazia deve continuar sem tarefas');

  store.alternar(pendente.id);
  assert.equal(store.limparConcluidas(), 1, 'deve remover a tarefa quando todas estão concluídas');
  assert.deepEqual(store.listar(), [], 'todas concluídas devem resultar em lista vazia');
  assert.deepEqual(JSON.parse(dadosSalvos), [], 'lista vazia deve ser persistida');
}

function armazenamentoSemDados() {
  return {
    getItem() {
      return null;
    },
    setItem() {
      assert.fail('lista vazia não deve persistir alterações');
    },
  };
}

test('limparConcluidas remove apenas concluídas e preserva/persiste as pendentes', testarLimparTarefasConcluidas);

export function testarFiltrarTarefas() {
  const dados = new Map();
  const armazenamento = {
    getItem(chave) {
      return dados.get(chave) ?? null;
    },
    setItem(chave, valor) {
      dados.set(chave, valor);
    },
  };
  const store = new TodoStore(armazenamento);
  const primeiraAtiva = store.adicionar('Ativa 1');
  const concluida = store.adicionar('Concluída');
  const segundaAtiva = store.adicionar('Ativa 2');
  store.alternar(concluida.id);

  assert.deepEqual(store.filtrar('all'), [primeiraAtiva, concluida, segundaAtiva]);
  assert.deepEqual(store.filtrar('active'), [primeiraAtiva, segundaAtiva]);
  assert.deepEqual(store.filtrar('completed'), [concluida]);
  assert.deepEqual(store.filtrar('invalid-filter'), [primeiraAtiva, concluida, segundaAtiva]);
  assert.deepEqual(store.listar(), [primeiraAtiva, concluida, segundaAtiva]);

  const storeVazia = new TodoStore({ getItem: () => null, setItem() {} });
  assert.deepEqual(storeVazia.filtrar('all'), []);
  assert.deepEqual(storeVazia.filtrar('active'), []);
  assert.deepEqual(storeVazia.filtrar('completed'), []);
}

test('filtrar mostra todas, ativas ou concluídas sem alterar a lista', testarFiltrarTarefas);

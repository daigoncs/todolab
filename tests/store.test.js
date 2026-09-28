import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TodoStore } from '../src/store.js';

export function testarAdicaoDeTarefas() {
  const persistencias = [];
  const armazenamento = {
    getItem() {
      return null;
    },
    setItem(chave, valor) {
      persistencias.push({ chave, valor });
    },
  };
  const store = new TodoStore(armazenamento);
  const casosInvalidos = ['', '   ', '\t\t', ' \t  '];

  for (const titulo of casosInvalidos) {
    const tarefasAntes = store.listar();
    const persistenciasAntes = persistencias.length;

    assert.equal(store.adicionar(titulo), null, `deve rejeitar ${JSON.stringify(titulo)}`);
    assert.deepEqual(store.listar(), tarefasAntes, 'a lista deve permanecer inalterada');
    assert.equal(persistencias.length, persistenciasAntes, 'não deve persistir casos inválidos');
  }

  const tarefa = store.adicionar('  revisar critérios da Issue  ');

  assert.ok(tarefa, 'deve criar tarefa com conteúdo válido');
  assert.equal(tarefa.titulo, 'revisar critérios da Issue');
  assert.deepEqual(store.listar(), [tarefa]);
  assert.equal(persistencias.length, 1, 'deve persistir a tarefa válida');
  assert.deepEqual(JSON.parse(persistencias[0].valor), [tarefa]);
}

test('adicionar rejeita títulos vazios e normaliza títulos válidos', testarAdicaoDeTarefas);

export function testarRemocaoDeTarefas() {
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
  const primeiraDuplicada = store.adicionar('Tarefa repetida');
  const tarefaRestante = store.adicionar('Outra tarefa');
  const segundaDuplicada = store.adicionar('Tarefa repetida');

  store.remover(segundaDuplicada.id);

  assert.deepEqual(
    store.listar().map(({ id }) => id),
    [primeiraDuplicada.id, tarefaRestante.id],
    'deve remover apenas a tarefa identificada pelo ID, mesmo com títulos repetidos',
  );
  assert.deepEqual(JSON.parse(dadosSalvos), store.listar(), 'deve persistir as duas tarefas restantes');

  const storeAposRecarga = new TodoStore(armazenamento);
  assert.deepEqual(
    storeAposRecarga.listar(),
    store.listar(),
    'a tarefa removida não deve reaparecer após recarregar',
  );

  const gravacoesAntesDeIdInexistente = gravacoes;
  store.remover('id-inexistente');
  assert.equal(gravacoes, gravacoesAntesDeIdInexistente, 'ID inexistente não deve alterar o armazenamento');
  assert.deepEqual(store.listar(), storeAposRecarga.listar());

  store.remover(primeiraDuplicada.id);
  store.remover(tarefaRestante.id);
  assert.deepEqual(store.listar(), [], 'deve permitir remover todas as tarefas');
  assert.deepEqual(JSON.parse(dadosSalvos), [], 'a lista vazia deve ser persistida após a última remoção');
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

export function testarPersistenciaResiliente() {
  let dadosSalvos = null;
  const armazenamento = {
    getItem() {
      return dadosSalvos;
    },
    setItem(chave, valor) {
      dadosSalvos = valor;
    },
  };
  const store = new TodoStore(armazenamento);
  const tarefaConcluida = store.adicionar('Tarefa concluída');
  const tarefaPendente = store.adicionar('Tarefa pendente');
  store.alternar(tarefaConcluida.id);
  const estadoSalvo = store.listar();

  const storeRestaurada = new TodoStore(armazenamento);
  assert.deepEqual(storeRestaurada.listar(), estadoSalvo, 'deve restaurar todos os campos e estados salvos');
  assert.equal(storeRestaurada.listar()[0].concluida, true);
  assert.equal(storeRestaurada.listar()[1].concluida, false);

  const casosInvalidos = [null, '', '{json corrompido', '{"tarefas":[]}', '[null]', '[{"id":"1"}]'];
  for (const dados of casosInvalidos) {
    const armazenamentoInvalido = {
      getItem() {
        return dados;
      },
      setItem() {},
    };
    const storeComDadosInvalidos = new TodoStore(armazenamentoInvalido);
    assert.deepEqual(storeComDadosInvalidos.listar(), [], `deve iniciar vazia com dados ${JSON.stringify(dados)}`);
    assert.ok(storeComDadosInvalidos.adicionar('Nova tarefa'), 'deve continuar aceitando operações');
    assert.equal(storeComDadosInvalidos.listar().length, 1);
  }

  const armazenamentoIndisponivel = {
    getItem() {
      throw new Error('leitura bloqueada');
    },
    setItem() {
      throw new Error('gravação bloqueada');
    },
  };
  const storeSemAcessoAoArmazenamento = new TodoStore(armazenamentoIndisponivel);
  assert.deepEqual(storeSemAcessoAoArmazenamento.listar(), [], 'falha de leitura deve iniciar com lista vazia');
  assert.doesNotThrow(() => storeSemAcessoAoArmazenamento.adicionar('Uso em memória'));
  assert.equal(storeSemAcessoAoArmazenamento.listar()[0].titulo, 'Uso em memória');

  const storeSemArmazenamento = new TodoStore(null);
  assert.deepEqual(storeSemArmazenamento.listar(), []);
  assert.ok(storeSemArmazenamento.adicionar('Sem localStorage'));
  assert.equal(storeSemArmazenamento.listar().length, 1);
  assert.equal(tarefaPendente.concluida, false);
}

test('carregar e salvar mantêm a aplicação utilizável diante de dados ou armazenamento inválidos', testarPersistenciaResiliente);
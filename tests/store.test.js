import assert from 'node:assert/strict';
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

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

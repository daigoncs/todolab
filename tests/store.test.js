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
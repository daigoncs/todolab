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

testarAdicionarTarefa();
console.log('Teste unitário aprovado: adicionar tarefa valida e normaliza o título.');
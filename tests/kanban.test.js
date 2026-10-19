import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TodoStore } from '../src/store.js';
import { renderizarColunasKanban } from '../src/kanban.js';

class ElementoFalso {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = children;
  }

  setAttribute(nome, valor) {
    this.attributes[nome] = valor;
  }
}

export function testarRenderizacaoDasColunasKanban() {
  const documento = {
    createElement(tagName) {
      return new ElementoFalso(tagName, documento);
    },
  };
  const container = new ElementoFalso('div', documento);

  const colunas = renderizarColunasKanban(container);

  assert.equal(container.children.length, 4, 'deve exibir exatamente quatro colunas');
  assert.deepEqual(
    colunas.map((coluna) => coluna.children[0].textContent),
    ['Novo', 'Em Progresso', 'Em Revisão', 'Concluído'],
    'deve exibir todos os títulos na ordem do fluxo',
  );
  assert.deepEqual(container.children, colunas, 'as quatro colunas devem aparecer simultaneamente');
  assert.ok(
    colunas.every((coluna) => coluna.tagName === 'section' && coluna.children[0].tagName === 'h3'),
    'cada etapa deve ser uma seção com título visível',
  );
  assert.deepEqual(
    colunas.map((coluna) => coluna.dataset.status),
    ['novo', 'em-progresso', 'em-revisao', 'concluido'],
    'cada coluna deve identificar sua etapa',
  );
  assert.ok(
    colunas.every((coluna) => coluna.children[1].tagName === 'ul' && coluna.children[1].children.length === 0),
    'colunas começam sem tarefas',
  );
}

test('renderizarColunasKanban exibe quatro etapas vazias na ordem correta', testarRenderizacaoDasColunasKanban);

export function testarTarefasNasColunasDoStatus() {
  const documento = {
    createElement(tagName) {
      return new ElementoFalso(tagName, documento);
    },
  };
  const container = new ElementoFalso('div', documento);
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
  const tarefas = [
    store.adicionar('Tarefa nova'),
    store.adicionar('Tarefa em progresso'),
    store.adicionar('Tarefa em revisão'),
    store.adicionar('Tarefa concluída'),
  ];
  const status = ['novo', 'em-progresso', 'em-revisao', 'concluido'];

  status.forEach((valor, indice) => store.atualizarStatus(tarefas[indice].id, valor));
  renderizarColunasKanban(container, store.listar());

  assert.deepEqual(
    container.children.map((coluna) => coluna.children[1].children.map((item) => item.textContent)),
    ['Tarefa nova', 'Tarefa em progresso', 'Tarefa em revisão', 'Tarefa concluída'].map((titulo) => [titulo]),
    'cada tarefa deve aparecer na coluna correspondente ao seu status',
  );

  const storeRecarregada = new TodoStore(armazenamento);
  renderizarColunasKanban(container, storeRecarregada.listar());
  assert.deepEqual(
    container.children.map((coluna) => coluna.children[1].children.map((item) => item.textContent)),
    ['Tarefa nova', 'Tarefa em progresso', 'Tarefa em revisão', 'Tarefa concluída'].map((titulo) => [titulo]),
    'as tarefas devem continuar nas colunas correspondentes após recarga',
  );

  storeRecarregada.atualizarStatus(tarefas[0].id, 'em-progresso');
  renderizarColunasKanban(container, storeRecarregada.listar());
  assert.deepEqual(
    container.children.map((coluna) => coluna.children[1].children.map((item) => item.textContent)),
    [[], ['Tarefa nova', 'Tarefa em progresso'], ['Tarefa em revisão'], ['Tarefa concluída']],
    'após alteração e nova renderização, a tarefa deve aparecer na nova coluna',
  );

  const listaComStatusLegado = [{
    id: 'status-invalido',
    status: 'desconhecido',
    titulo: 'Não pertence a uma coluna',
  }];
  renderizarColunasKanban(container, listaComStatusLegado);
  assert.ok(
    container.children.every((coluna) => coluna.children[1].children.length === 0),
    'status sem coluna correspondente não deve criar coluna adicional',
  );
}

test('tarefas aparecem nas colunas pelo status atual e persistido', testarTarefasNasColunasDoStatus);

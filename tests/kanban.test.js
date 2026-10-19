import assert from 'node:assert/strict';
import { test } from 'node:test';
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
  assert.ok(colunas.every((coluna) => coluna.children.length === 1), 'colunas começam sem tarefas');
}

test('renderizarColunasKanban exibe quatro etapas vazias na ordem correta', testarRenderizacaoDasColunasKanban);

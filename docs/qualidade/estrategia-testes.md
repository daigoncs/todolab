# Estratégia de testes do TodoLab — Issue #46

## Objetivo

Garantir que a evolução do TodoLab não provoque regressões nas funcionalidades existentes. Esta estratégia usa testes unitários e testes de integração leves, sem bibliotecas externas.

## Funcionalidades críticas

| Área                           | Comportamentos cobertos                                                  | Risco crítico                                           |
| ------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| CRUD de tarefas                | Criar, listar, editar e remover; rejeitar título vazio ou só com espaços | Dados inválidos, perda de tarefas                       |
| Conclusão em massa             | Concluir todas ou reverter todas; limpar concluídas                      | Alteração incorreta de vários itens                     |
| Persistência                   | Gravar, recarregar e migrar dados legados; falhas de leitura/escrita     | Perda ou corrupção de dados                             |
| Status/Kanban                  | Quatro estados, transições permitidas e renderização por coluna          | Tarefa perdida ou exibida na coluna errada              |
| Prioridade e prazo             | Valores padrão, normalização, atrasos e conclusão                        | Informação incorreta ou tarefa concluída ainda atrasada |
| Filtros e operações auxiliares | Todas, ativos, concluídos e proteção da lista interna                    | Exibição inconsistente                                  |

## Ferramentas existentes

- Node.js `node:test` para testes unitários.
- Node.js `assert/strict` para validações determinísticas.
- Armazenamento falso em memória (`Map`) em substituição ao `localStorage` real.
- Elementos DOM falsos para testar a renderização do Kanban sem framework.
- Comandos `npm test` para execução e `npm run check` para lint e build.

Não são necessárias novas dependências nem ferramentas de carga ou performance nesta etapa.

## Pirâmide de testes

### Testes unitários

Devem validar regras puras de domínio em `TodoStore`, preferencialmente com armazenamento em memória. Casos mínimos:

- Entrada válida e inválida;
- Operações que mudam uma tarefa;
- Operações em massa;
- Falha de persistência;
- Recarregamento e dados legados;
- Transições de status válidas e inválidas;
- Normalização de prioridade e prazo.

### Testes de integração leves

Devem combinar `TodoStore` com `renderizarColunasKanban` para verificar:

- Uma tarefa criada no store aparece na coluna correspondente;
- Uma alteração de status move a tarefa entre colunas após renderização;
- A persistência mantém a coluna após recarga;
- Status desconhecido não cria coluna nem perde dados;
- Renderizações repetidas não duplicam nem removem tarefas.

A integração com navegador não usa Playwright nesta etapa. O DOM real continua coberto pelo build e pela revisão manual.

## Cenários críticos e de borda

- Título `""`, `"   "`, tabulações e quebras de linha;
- ID inexistente;
- Status fora da lista permitida;
- Lista vazia;
- Lista já concluída ou parcialmente concluída;
- Falha ao ler ou gravar;
- JSON persistido inválido;
- Dados antigos sem campos novos;
- Prazo inválido ou em formato incorreto;
- Prazo anterior, igual ou posterior à data atual;
- Tarefa concluída com prazo vencido.

## Estratégia de execução

1. Executar `npm test` antes e depois de mudanças.
2. Executar `npm run check` para confirmar lint e build.
3. Corrigir falhas relacionadas à implementação antes da revisão.
4. Registrar o resultado em Pull Request, issue ou diário.
5. Reexecutar a suíte completa após qualquer alteração no store, persistência ou Kanban.

## Resultados esperados

- Suíte unitária verde;
- Nenhum teste novo modifica dados reais ou abre dependência externa;
- Operações inválidas não persistem alterações;
- Transições válidas persistem e reaparecem corretamente;
- Dados legados são normalizados sem perda de campos existentes;
- Renderização repetida continua idempotente.

## Preparação para evolução

Os testes devem continuar organizados por comportamento em `tests/store.test.js` e `tests/kanban.test.js`, com armazenamento falso isolado e funções exportadas por cenário. Novos módulos podem reutilizar o mesmo padrão de objeto de armazenamento e recarga independente.

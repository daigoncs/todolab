# Checklist de revisão técnica

Use este checklist para revisar uma **Issue** antes de iniciar a implementação e para registrar a revisão técnica feita pelo professor na Aula 05.

> Uma Issue aprovada na revisão não é funcionalidade entregue. Ela está pronta para seguir ao fluxo: Issue → branch → Pull Request (solicitação de integração) → CI (Integração Contínua) → revisão → merge (mesclagem) → publicação.

## Identificação

- Número e título da Issue:
- Data da revisão:
- Revisor: Professor Alexandre Barbosa
- Equipe:
- Decisão: [ ] aprovada para desenvolvimento  [ ] devolvida para ajuste

## Definition of Ready — Definição de Pronto para Iniciar

Marque somente o que puder ser demonstrado na própria Issue.

- [ ] O título descreve o comportamento esperado, e não uma solução técnica.
- [ ] O pedido informa para quem e em qual contexto o comportamento importa.
- [ ] Há ao menos um cenário no formato **Dado que / Quando / Então**.
- [ ] Cada cenário é observável e permite decidir objetivamente entre passou ou falhou.
- [ ] Casos de exceção, limite ou borda foram declarados quando aplicáveis.
- [ ] O que está fora do escopo foi registrado.
- [ ] A forma de verificação manual foi indicada.
- [ ] A mudança cabe no tempo disponível para uma rodada; se não couber, foi dividida.

## Registro de achados

| Categoria | Achado ou ambiguidade | Ajuste solicitado | Resolvido? |
|---|---|---|---|
| Escopo |  |  | [ ] |
| Critério de aceite |  |  | [ ] |
| Exceção ou limite |  |  | [ ] |
| Verificação |  |  | [ ] |
| Rastreabilidade |  |  | [ ] |

## Exemplo de contraste

**Inadequado:** “O botão deve funcionar bem.”

**Verificável:** “Dado que existam duas tarefas concluídas e uma pendente, quando a pessoa selecionar ‘Limpar concluídas’, então apenas as duas concluídas são removidas e a pendente permanece visível.”

## Próximo passo após aprovação

1. Criar uma branch (ramificação) pequena vinculada à Issue.
2. Registrar o diálogo com a ferramenta de IA em `docs/prompts/ISSUE-NN.md`.
3. Implementar a mudança e executar `npm run check` localmente.
4. Abrir um Pull Request com `Closes #NN`.
5. Aguardar o CI verde e a revisão substantiva de outra pessoa.
6. Só então avaliar o merge conforme a política do repositório.

## Nota sobre CODEOWNERS

`CODEOWNERS` documenta quem é responsável por revisar caminhos do repositório. Ele **não cria bloqueio por si só**: a exigência automática de aprovação depende de proteção de branch configurada no GitHub. Essa proteção está prevista para a Aula 11; não deve ser declarada como ativa na Aula 05.

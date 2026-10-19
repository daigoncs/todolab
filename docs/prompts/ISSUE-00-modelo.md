# ISSUE-00 — Modelo de registro de diálogo com IA

Copie este arquivo para `ISSUE-NN.md`, substituindo `NN` pelo número real da Issue. Registre o que foi efetivamente enviado e recebido; não preencha com exemplos fictícios.

## Identificação da rodada

- Issue: #NN —
- Branch (ramificação):
- Autor da alteração:
- Revisor previsto:
- Data:

## Contexto aprovado

- Link ou referência da Issue:
- Critérios de aceite revisados pelo professor:
- Arquivos que podem ser alterados:
- Arquivos que não devem ser alterados:

## Prompt inicial enviado à IA

```text
Atue como equipe de desenvolvimento do TodoLab.

Contexto: [descreva a Issue e o comportamento esperado].
Critérios de aceite aprovados:
- Dado que ...
  Quando ...
  Então ...

Restrições:
- JavaScript puro, sem novas dependências.
- Preserve as assinaturas existentes quando não houver justificativa para alterá-las.
- Altere somente os arquivos necessários.
- Explique quais arquivos foram modificados e como verificar manualmente.
```

## Resposta recebida da IA

```text
Cole aqui a resposta integral recebida.
```

## Verificação humana antes do Pull Request

- [ ] O diff foi lido pela equipe.
- [ ] Os critérios de aceite foram comparados com a alteração.
- [ ] `npm run check` foi executado e o resultado real foi registrado.
- [ ] A verificação manual no navegador foi realizada.
- [ ] Pendências, limitações ou dúvidas foram registradas abaixo.

Resultado real do `npm run check`:

```text
Cole aqui a saída relevante.
```

Verificação manual realizada:

- Passos:
- Resultado observado:
- Pendências ou riscos:

## Pull Request e revisão

- URL ou número do Pull Request:
- Autor do Pull Request:
- Revisor (integrante diferente do autor):
- O PR contém `Closes #NN`? [ ] sim [ ] não
- Commit ou hash da versão revisada:
- Resultado do CI: [ ] verde [ ] vermelho [ ] ainda em execução
- Comentário substantivo do revisor (referencie um critério de aceite):
- Há mudanças solicitadas abertas? [ ] sim [ ] não
- A aprovação é da versão atual, depois das últimas correções? [ ] sim [ ] não [ ] não houve correção
- Aceite manual registrado, com cenários e resultado observado:
- Decisão: [ ] merge autorizado [ ] mudanças solicitadas [ ] pendente

O merge só é autorizado com CI verde, nenhuma mudança solicitada aberta, aceite manual registrado e aprovação da versão atual. Enquanto qualquer condição faltar, a decisão permanece pendente.

## Aprendizado da rodada

- Ambiguidade encontrada:
- Decisão tomada:
- Próxima melhoria de processo:

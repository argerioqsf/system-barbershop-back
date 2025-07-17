# AGENTS.md

Este projeto usa Node.js 20 e TypeScript com Fastify e Prisma. Os testes são executados via Vitest.

## Estilo de código
- Indentação de 2 espaços.
- Utilize `npm run lint` para aplicar o ESLint (configurado via `@rocketseat/eslint-config`).
- Execute `npm run typecheck` para checar tipos com `tsc`.
- Os arquivos de origem ficam em `src/` e os testes em `test/`.
- Ao criar novas regras de negócio, isole a lógica em funções de nomes claros.
- Reaproveite código agrupando lógicas semelhantes em funções reutilizáveis.
- Dê nomes de variáveis que expliquem seu propósito e contexto.
- Evite utilizar o tipo `any`. Mantenha tudo estritamente tipado e recorra ao
  `any` apenas quando não houver alternativa viável.

## Testes
- Antes de enviar código, rode `npm test` para garantir que todos os testes Vitest passam.
- O arquivo `test/setup.ts` define variáveis de ambiente padrão utilizadas durante os testes.

## Variáveis de ambiente
- Sempre que adicionar novas variáveis, atualize `.env.example`, `test/setup.ts` e `src/env/index.ts`.

## Manutenção de artefatos
- Caso o código modifique dados iniciais, atualize `src/repositories/prisma/seed.ts`.
- Sincronize a coleção de requisições `insominia-barbershop.json` quando necessário.
- Atualize os testes dos arquivos modificados e crie testes para novos módulos.
- Ao alterar `prisma/schema.prisma`, gere novas migrations.

## Pull Requests
- Descreva de forma concisa a alteração realizada.
- Caso adicione novas variáveis de ambiente, atualize `.env.example`, `test/setup.ts` e `src/env/index.ts`.
- Siga a estrutura existente de pastas e nomes de arquivos.

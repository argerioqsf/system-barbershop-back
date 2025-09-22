# barbershop API

Esta API gerencia recursos de uma barbearia usando Fastify e Prisma.

Documentação complementar:
- `docs/sale-flow-overview.md`: visão geral da arquitetura do módulo de vendas.
- `docs/SALE_FLOW_REFACTOR_PLAN.md`: histórico completo da migração do fluxo de vendas.
- `docs/sale-migration-checklist.md`: checklist de validação e rollback da migração.
- `docs/NEXT_MODULES_MIGRATION_PLAN.md`: roadmap para os próximos módulos a migrar.

## Arquitetura do módulo de vendas

O fluxo de vendas foi migrado para uma camada modular em `src/modules/sale`. Cada operação relevante (criar venda, atualizar itens, aplicar cupons, realizar pagamento) expõe um *use case* especializado instanciado por factories no diretório `src/modules/sale/infra`. Os controllers HTTP chamam apenas essas factories, garantindo orquestração explícita e telemetria padronizada. Consulte `docs/sale-flow-overview.md` para detalhes e exemplos de dependências injetadas.

## Requisitos

- Node.js 20.19.0 ou superior
- Docker e Docker Compose

## Configurando o ambiente

1. Copie o arquivo `.env.example` para `.env`.
2. Ajuste as variáveis conforme seu ambiente:

```ini
NODE_ENV=dev               # Ambiente de execução
JWT_SECRET=complexedpassword       # Segredo dos JWTs
DATABASE_URL="mysql://usuario:senha@mysqldb:3306/nome_do_banco"
PASSWORD_SEED=complexedpassword    # Senha utilizada no seed
TOKEN_EMAIL_TWILIO=xxxxxxxxxxxxxxxx
APP_WEB_URL=http://localhost:3000
```

### O que significa cada variável?

- **NODE_ENV** – define o modo de execução (`dev`, `test` ou `production`).
- **JWT_SECRET** – chave usada para assinar e validar os tokens JWT.
- **DATABASE_URL** – string de conexão do banco. Siga o padrão:

  ```
  mysql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
  ```

  - `USUARIO` e `SENHA`: credenciais do MySQL
  - `HOST`: endereço do banco (`mysqldb` quando usando o `docker-compose.yml`)
  - `PORTA`: porta de acesso (geralmente `3306`)
  - `NOME_DO_BANCO`: nome do schema a ser utilizado
- **PASSWORD_SEED** – senha inicial utilizada para os usuários criados no seed.
- **TOKEN_EMAIL_TWILIO** – token de autenticação da API da Twilio.
- **APP_WEB_URL** – URL base da aplicação web utilizada nos links enviados por email.

## Instalação

Instale as dependências e gere os artefatos do Prisma:

```bash
npm install
```

## Subindo com Docker

Execute:

```bash
docker compose up
```

Quando `NODE_ENV=dev`, o contêiner aplica migrations e executa o seed automaticamente.

## Execução local (sem Docker)

Com o banco de dados rodando, aplique migrations e seed manualmente:

```bash
npx prisma migrate reset
```

Depois inicie o servidor:

```bash
npm run dev
```

A API ficará disponível em `http://localhost:3333`.

## Testes

Rode as seguintes tarefas antes de enviar código:

```bash
npm run lint
npm run typecheck
npm test

# Rodar somente os testes de integração do fluxo de vendas
npm test -- sale-http.spec.ts
```

## Coleção Insomnia

O arquivo `insominia-barbershop.yaml` contém todas as requisições para testar as rotas.
Importe-o no Insomnia e defina a variável `baseURL` para o endereço onde a aplicação está rodando (ex.: `http://localhost:3333`).

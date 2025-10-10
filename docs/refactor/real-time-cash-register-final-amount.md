# Refatoração: Cálculo em Tempo Real do Valor Final do Caixa

## Objetivo

O objetivo desta refatoração é alterar a forma como o `finalAmount` de uma `CashRegisterSession` é calculado. Em vez de ser um cálculo único realizado no momento do fechamento do caixa, ele se tornará um valor atualizado em tempo real, refletindo cada transação (entrada ou saída) no momento em que ela ocorre.

Isso garantirá que o valor do caixa esteja sempre preciso, melhorando a performance de leitura e fornecendo dados em tempo real para a aplicação.

## Plano de Ação

A implementação será dividida em três fases principais:

### Fase 1: Criação da Lógica Central de Atualização

1.  **Criar Novo Serviço (`UpdateCashRegisterFinalAmountService`)**
    *   **Arquivo:** `src/services/cash-register/update-cash-register-final-amount.ts`
    *   **Responsabilidade:** Este serviço terá um método `execute` que recebe `sessionId`, `amount` e um cliente de transação opcional (`tx`). Ele será o único responsável por invocar a atualização no repositório.

2.  **Atualizar o Repositório (`CashRegisterRepository`)**
    *   **Interface:** Adicionar a assinatura do novo método na interface `src/repositories/cash-register-repository.ts`:
        ```typescript
        incrementFinalAmount(sessionId: string, amount: number, tx?: Prisma.TransactionClient): Promise<CashRegisterSession>
        ```
    *   **Implementação:** Implementar o método no `prisma-cash-register-repository.ts`, utilizando a operação atômica `increment` do Prisma para garantir consistência.
        ```typescript
        async incrementFinalAmount(sessionId, amount, tx) {
          const prismaClient = tx || prisma
          return prismaClient.cashRegisterSession.update({
            where: { id: sessionId },
            data: {
              finalAmount: {
                increment: amount,
              },
            },
          })
        }
        ```

### Fase 2: Ajuste no Ciclo de Vida do Caixa

1.  **Na Criação (`create-session.ts`)**
    *   Localizar o serviço responsável por criar uma nova sessão de caixa.
    *   No momento da criação (`repository.create`), garantir que o campo `finalAmount` seja inicializado com o mesmo valor de `openingAmount`.

2.  **No Fechamento (`close-session.ts`)**
    *   **Arquivo:** `src/services/cash-register/close-session.ts`
    *   Remover a lógica que usa `reduce()` para calcular o `finalAmount` a partir das transações.
    *   A chamada ao `repository.close()` passará a definir apenas o `closedAt`, pois o `finalAmount` já estará correto no banco de dados.

### Fase 3: Integração com os Fluxos de Transação

Para cada serviço de alto nível que gera uma movimentação financeira, vamos orquestrar uma transação atômica do Prisma que engloba a lógica de negócio atual e a nova atualização do caixa.

1.  **Pagamento de Venda (`pay-sale.ts`)**
    *   **Arquivo:** `@/modules/finance/application/use-cases/pay-sale.ts`
    *   Dentro da função `run` que já utiliza `prisma.$transaction`, após a distribuição de comissões, adicionar a chamada ao `UpdateCashRegisterFinalAmountService`.
    *   **Valor:** `+updatedSale.total` (adição do valor total da venda).

2.  **Adição de Saldo (`add-balance-transaction.ts`)**
    *   **Arquivo:** `@/services/transaction/add-balance-transaction.ts`
    *   Envolver a lógica do método `execute` em um bloco `prisma.$transaction(async (tx) => { ... })`.
    *   Passar o `tx` para as chamadas internas (`incrementProfile.execute`, `incrementUnit.execute`).
    *   Adicionar a chamada ao `UpdateCashRegisterFinalAmountService` dentro do mesmo bloco.
    *   **Valor:** `+data.amount` (adição do valor).

3.  **Retirada de Saldo (`withdrawal-balance-transaction.ts`)**
    *   **Arquivo:** `@/services/transaction/withdrawal-balance-transaction.ts`
    *   Aplicar a mesma lógica de `prisma.$transaction` do item anterior.
    *   **Valor:** `-data.amount` (subtração do valor).

4.  **Pagamento de Saldo/Comissão (`pay-balance-transaction.ts`)**
    *   **Arquivo:** `@/services/transaction/pay-balance-transaction.ts`
    *   Aplicar a mesma lógica de `prisma.$transaction` dos itens anteriores.
    *   **Valor:** `-payValue` (subtração do valor total que está sendo pago ao profissional).

### Fase 4: Verificação

1.  **Testes:** Executar a suíte de testes existente (`npm test`) para garantir que nenhuma funcionalidade foi quebrada.
2.  **Testes Manuais:** Realizar um fluxo de teste manual para validar o novo comportamento:
    a. Abrir um caixa.
    b. Realizar uma venda e verificar se o `finalAmount` foi incrementado.
    c. Realizar uma retirada e verificar se o `finalAmount` foi decrementado.
    d. Fechar o caixa e confirmar que o valor final está correto sem o cálculo `reduce`.

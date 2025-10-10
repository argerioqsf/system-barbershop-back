# Padronização da Estrutura de Roteamento dos Módulos

## Status: Proposto

Este documento descreve uma proposta para padronizar a estrutura de roteamento em todos os módulos da aplicação, seguindo o padrão de arquitetura já adotado por módulos mais recentes.

## Contexto

Durante a implementação da funcionalidade de "Dashboard do Colaborador", foi observado que a estrutura do projeto segue um padrão de Arquitetura Limpa/DDD, com a lógica de negócio organizada em `modules` que contêm as camadas `application`, `domain` e `infra`.

No entanto, notou-se que a definição das rotas e dos controllers HTTP não segue um padrão uniforme em toda a base de código. Módulos mais antigos podem ter uma estrutura diferente dos mais novos.

O padrão identificado como ideal e utilizado na nova funcionalidade é:

-   **Lógica de Negócio (Use Cases):** `src/modules/{nome-do-modulo}/application/use-cases/`
-   **Controllers e Rotas (Camada de Apresentação):** `src/http/controllers/{nome-do-modulo}/`

## Proposta

Para aumentar a consistência, manutenibilidade e facilitar a navegação no projeto, propõe-se que **todos os módulos existentes sejam gradualmente refatorados** para seguir esta mesma estrutura.

### Passos para Refatoração de um Módulo

1.  **Mover Controllers:** Se o controller de um módulo estiver em um local diferente, movê-lo para `src/http/controllers/{nome-do-modulo}/{nome-do-controller}.controller.ts`.
2.  **Mover Definição de Rotas:** Se o arquivo de rotas estiver em um local diferente, movê-lo para `src/http/controllers/{nome-do-modulo}/routes.ts`.
3.  **Mover Lógica de Negócio:** Garantir que toda a lógica de negócio esteja contida em *Use Cases* dentro de `src/modules/{nome-do-modulo}/application/use-cases/`.
4.  **Atualizar Registros:** Garantir que a rota principal do módulo seja registrada corretamente no arquivo `src/app.ts`.

## Benefícios

-   **Consistência:** Todos os módulos seguirão a mesma estrutura, reduzindo a carga cognitiva para novos desenvolvedores.
-   **Separação de Responsabilidades Clara:** Reforça a separação entre a camada de aplicação (o que a aplicação faz) e a camada de apresentação (como a funcionalidade é exposta via HTTP).
-   **Manutenibilidade:** Facilita encontrar arquivos e entender o fluxo de uma requisição.

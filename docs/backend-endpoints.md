# Backend Endpoints (Contrato + Checklist)

Este arquivo consolida o contrato do backend e referencia a integração no frontend (pasta features/* e actions/*). Use como fonte de verdade para priorizar/migrar integrações.

Convenções gerais
- Autenticação: Bearer token (header `Authorization`) após `POST /sessions`.
- Refresh de token: backend pode devolver novo token no corpo JSON (campo `token`) OU no header `x-new-token`. O frontend deve detectar e substituir o token ativo.
- Content-Type padrão: `application/json`; rotas com upload usam `multipart/form-data` (campo de arquivo indicado no endpoint).
- Paginação (v1): query param `page`; resposta preferencial { items, count }. O frontend tolera array puro.
- Paginação (v2): quando houver `withCount=true`, resposta vira `{ items, count, page, perPage }`.
- Busca: quando aplicável, use `q` ou filtros específicos (`name`, `code`, etc.).
- Erros: backend deve retornar `{ message }` em erros HTTP; o frontend propaga essa mensagem.
- i18n: páginas usam locale dinâmico; evitar prefixos fixos.

Formato recomendado de resposta
- Listagem: { <resourcePlural>: T[], count: number }
- Detalhe: { <resourceSingular>: T }
- Alternativa tolerada pelo front (migração): T[] (listagem) ou T (detalhe) — já tratado nos fetchers.

Contrato detalhado por domínio (fornecido)

Autenticação
- POST `/users` (cria usuário) [público]
  - Body: `{ name, email, password, phone, cpf, genre, birthday, pix, unitId, roleId, permissions?[] }`
  - Exemplo (request): `{ "name": "João", "email": "joao@ex.com", "password": "123456", "phone": "+55 11 99999-9999", "cpf": "123.456.789-00", "genre": "MALE", "birthday": "1995-06-10", "pix": "joao@bank.com", "unitId": "unit_1", "roleId": "role_barber" }`
  - Resposta: 201 (sem corpo)
- POST `/sessions` (login) [público]
  - Body: `{ email, password }`
  - Exemplo: `{ "email": "user@exemplo.com", "password": "senha123" }`
  - Resposta: `{ user, roles, token }`
  - Exemplo (resposta): `{ "user": { "id": "usr_1", "email": "user@exemplo.com", "unitId": "unit_1", "organizationId": "org_1", "profile": { "id": "prof_1", "name": "User", "role": { "name": "BARBER" } } }, "roles": ["ADMIN","OWNER","MANAGER","BARBER"], "token": "<jwt>" }`
- POST `/forgot-password` [público]
  - Body: `{ email }`
  - Exemplo (request): `{ "email": "user@exemplo.com" }`
  - Resposta: 200 (sem corpo)
- POST `/reset-password` [público]
  - Body: `{ token, password }`
  - Exemplo (request): `{ "token": "reset_token", "password": "novaSenha123" }`
  - Resposta: 200 (sem corpo)

Sessão
- PATCH `/sessions/unit` (altera unidade ativa) [protegido]
  - Body: `{ unitId }`
  - Pode retornar novo token (corpo ou header `x-new-token`).
  - Exemplo (request): `{ "unitId": "unit_2" }`
  - Resposta: 200 `{}` (header opcional `x-new-token`)

Uploads
- POST `/upload` (arquivo único) [sem JWT]
  - multipart/form-data campo `file`: `avatar`
  - Exemplo (form-data): `avatar: <arquivo.jpg>`
  - Resposta: `"SUCCESS"`
- GET `/uploads` [sem JWT]
  - Resposta: `[{ "filename": "abc.jpg", "url": "/uploads/abc.jpg" }]`
- GET `/uploads/:filename` [sem JWT]
  - Resposta: stream do arquivo (image/*)
- DELETE `/uploads/:filename` [sem JWT]
  - Resposta: `"File deleted successfully"`

Perfil (do logado e administrativo)
- GET `/profile` [protegido] → `{ profile, roles, openingHours }`
  - Exemplo (resposta): `{ "profile": { "id": "prof_1", "name": "João", "user": { "id": "usr_1", "unit": { "id": "unit_1", "name": "Barbearia Centro" } }, "role": { "name": "BARBER" } }, "roles": ["ADMIN","OWNER","MANAGER","BARBER"], "openingHours": [{ "id": "oh_1", "weekDay": 1, "startHour": "09:00", "endHour": "18:00" }] }`
- POST `/create/profile` [protegido]
  - Body: `{ phone, cpf, genre, birthday, pix, roleId, permissions?[] }`
  - Exemplo (request): `{ "phone": "+55 11 99999-9999", "cpf": "123.456.789-00", "genre": "MALE", "birthday": "1995-06-10", "pix": "chave@pix", "roleId": "role_barber" }`
  - Resposta: `profile`
- PUT `/profile/:id` [protegido]
  - Body: `{ name, email, active, phone, cpf, genre, birthday, pix, roleId }`
  - Exemplo (request): `{ "name": "João Silva", "email": "joao@ex.com", "active": true, "phone": "+55 11 99999-9999", "cpf": "123.456.789-00", "genre": "MALE", "birthday": "1995-06-10", "pix": "chave@pix", "roleId": "role_barber" }`
  - Resposta: `{ profile }`
- PUT `/profile` [protegido]
  - Body: `{ name, email, active, phone, cpf, genre, birthday, pix }`
  - Exemplo (request): `{ "name": "João Silva", "email": "joao@ex.com", "active": true, "phone": "+55 11 99999-9999", "cpf": "123.456.789-00", "genre": "MALE", "birthday": "1995-06-10", "pix": "chave@pix" }`
  - Resposta: `{ profile }`

Perfil – Horários de trabalho/bloqueio
- POST `/profile/:profileId/work-hours` [protegido]
  - Body: `{ weekDay(0–6), startHour, endHour }`
  - Exemplo: `{ "weekDay": 1, "startHour": "09:00", "endHour": "18:00" }`
  - Resposta: `{ workHour, workingHours }`
  - Exemplo (resposta): `{ "workHour": { "id": "wh_1", "weekDay": 1, "startHour": "09:00", "endHour": "18:00" }, "workingHours": [{ "id": "wh_1", "weekDay": 1, "startHour": "09:00", "endHour": "18:00" }] }`
- DELETE `/profile/:profileId/work-hours/:id` [protegido] → 204
- POST `/profile/:profileId/blocked-hours` [protegido]
  - Body: `{ startHour(date), endHour(date) }`
  - Exemplo: `{ "startHour": "2025-01-01T10:00:00.000Z", "endHour": "2025-01-01T12:00:00.000Z" }`
  - Resposta: `blocked`
  - Exemplo (resposta): `{ "id": "bh_1", "startHour": "2025-01-01T10:00:00.000Z", "endHour": "2025-01-01T12:00:00.000Z" }`
- DELETE `/profile/:profileId/blocked-hours/:id` [protegido] → 204

Usuários da barbearia (gestão)
- POST `/barber/users` [protegido]
  - Body: `{ name, email, password, phone, cpf, genre, birthday, pix, unitId?, roleId, permissions?[], commissionPercentage?, services?: { serviceId, time?, commissionPercentage?, commissionType? }[], products?: { productId, commissionPercentage?, commissionType? }[] }`
  - Exemplo (request):
    `{ "name": "Maria", "email": "maria@ex.com", "password": "123456", "phone": "+55 11 98888-7777", "cpf": "987.654.321-00", "genre": "FEMALE", "birthday": "1990-01-20", "pix": "maria@bank.com", "roleId": "role_barber", "permissions": ["perm_1","perm_2"], "commissionPercentage": 15, "services": [{ "serviceId": "srv_1", "time": 40, "commissionPercentage": 10, "commissionType": "PERCENTAGE_OF_ITEM" }], "products": [{ "productId": "prd_1", "commissionPercentage": 5, "commissionType": "PERCENTAGE_OF_ITEM" }] }`
  - Resposta: `{ user: { id: "usr_2", email: "maria@ex.com" }, profile: { id: "prof_2", name: "Maria" } }`
  - Observação: `commissionType` aceita `PERCENTAGE_OF_ITEM` | `PERCENTAGE_OF_USER` | `PERCENTAGE_OF_USER_ITEM`
- GET `/barber/users` [protegido] → `{ users: [..., balance] }`
  - Exemplo (resposta): `{ "users": [{ "id": "usr_1", "name": "João", "balance": 120.5 }] }`
- GET `/barber/users/:id` [protegido] → `{ ...user, balance, loans }`
  - Exemplo (resposta): `{ "id": "usr_1", "name": "João", "email": "joao@ex.com", "balance": 120.5, "loans": [{ "id": "loan_1", "amount": 300, "status": "APPROVED" }] }`
- PUT `/barber/users/:id` [protegido]
  - Body parcial: `{ name?, phone?, cpf?, genre?, birthday?, pix?, unitId?, roleId?, permissions?[], commissionPercentage?, active?, services?: { serviceId, time?, commissionPercentage?, commissionType? }[], products?: { productId, commissionPercentage?, commissionType? }[], removeServiceIds?: string[], removeProductIds?: string[] }`
  - Pode renovar token do próprio usuário
  - Exemplo (request): `{ "name": "João da Silva", "active": true }`
  - Resposta: `{ user: { "id": "usr_1", "name": "João da Silva" } }` (pode incluir header `x-new-token`)
  - Observação: `commissionType` aceita `PERCENTAGE_OF_ITEM` | `PERCENTAGE_OF_USER` | `PERCENTAGE_OF_USER_ITEM`
- DELETE `/barber/users/:id` [protegido] → 204

Serviços (barbearia)
- POST `/create/service` [protegido]
  - multipart/form-data (arquivo: `image`)
  - Campos de form: `{ name, description?, cost, price, categoryId, defaultTime?, commissionPercentage? }`
  - Exemplo (form-data): `image: <arquivo.png>`, `name: "Corte"`, `price: 35`, `cost: 10`, `categoryId: "cat_id"`
  - Resposta: `{ "id": "srv_1", "name": "Corte", "price": 35, "cost": 10, "imageUrl": "/uploads/corte.png", "categoryId": "cat_id" }`
- GET `/services` [protegido]
  - Query: `{ withCount?, page?, perPage?, name?, categoryId? }`
  - Resposta: `items` ou `{ items, count, page, perPage }`
  - Exemplo (resposta comCount=false): `[{ "id": "srv_1", "name": "Corte", "price": 35 }]`
  - Exemplo (resposta withCount=true): `{ "items": [{ "id": "srv_1", "name": "Corte" }], "count": 1, "page": 1, "perPage": 10 }`
- GET `/services/:id` [protegido] → `service` (404 se não existir)
  - Exemplo (resposta): `{ "id": "srv_1", "name": "Corte", "price": 35 }`

Agendamentos
- POST `/create/appointment` [protegido]
  - Body: `{ clientId, barberId, serviceIds:[string]+, date(date), unitId? }`
  - Exemplo: `{ "clientId": "client_id", "barberId": "user_id", "serviceIds": ["service_id"], "date": "2025-01-01T13:00:00.000Z", "unitId": "unit_id" }`
  - Resposta: `{ "id": "appt_1", "clientId": "client_id", "barberId": "user_id", "date": "2025-01-01T13:00:00.000Z", "status": "SCHEDULED" }`
- GET `/appointments` [protegido]
  - Query: `{ withCount?, page?, perPage? }`
  - Exemplo (resposta): `{ "items": [{ "id": "appt_1", "status": "SCHEDULED" }], "count": 1, "page": 1, "perPage": 10 }`
- GET `/appointment-barbers` [protegido] → `users`
  - Exemplo (resposta): `[{ "id": "usr_1", "name": "João" }]`
- PATCH `/appointments/:id` [protegido]
  - Body: `{ status?, observation? }`
  - Exemplo: `{ "status": "CANCELED", "observation": "Cliente desmarcou" }`
  - Resposta: `{ "id": "appt_1", "status": "CANCELED", "observation": "Cliente desmarcou" }`

Produtos
- POST `/products` [protegido]
  - multipart/form-data (arquivo: `image`)
  - Form: `{ name, description?, quantity?, cost, price, commissionPercentage?, categoryId }`
  - Exemplo (form-data): `image: <arquivo.png>`, `name: "Pente"`, `price: 15`, `cost: 5`, `categoryId: "cat_id"`
  - Resposta: `{ "id": "prd_1", "name": "Pente", "price": 15, "imageUrl": "/uploads/pente.png" }`
- GET `/products` [protegido]
  - Query: `{ withCount?, page?, perPage?, name? }`
  - Resposta: `items` ou `{ items, count, page, perPage }`
  - Exemplo (resposta): `{ "items": [{ "id": "prd_1", "name": "Pente" }], "count": 1, "page": 1, "perPage": 10 }`
- GET `/products/:id` [protegido] → `product` (404 se não existir)
  - Exemplo (resposta): `{ "id": "prd_1", "name": "Pente", "price": 15 }`
- PATCH `/products/:id` [protegido]
  - Body parcial: `{ name?, description?, quantity?, cost?, price?, commissionPercentage?, categoryId? }`
  - Exemplo (request): `{ "price": 18 }`
  - Resposta: `{ "id": "prd_1", "price": 18 }`
- DELETE `/products/:id` [protegido] → 204
- GET `/product-sellers` [protegido] → `users`
  - Exemplo (resposta): `[{ "id": "usr_1", "name": "João" }]`

Categorias
- POST `/categories` [protegido] → `category`
  - Exemplo (request): `{ "name": "Serviços" }`
- GET `/categories` [protegido] → `categories`
- PATCH `/categories/:id` [protegido]
  - Body: `{ name? }`
  - Resposta: `category`
  - Exemplo (create resposta): `{ "id": "cat_1", "name": "Serviços" }`
  - Exemplo (list resposta): `[{ "id": "cat_1", "name": "Serviços" }]`
  - Exemplo (update resposta): `{ "id": "cat_1", "name": "Serviços Gerais" }`

Cupons
- POST `/coupons` [protegido]
  - Body: `{ code, description?, discount(number), discountType: 'PERCENTAGE'|'VALUE', imageUrl?, quantity? }`
  - Exemplo: `{ "code": "PROMO10", "discount": 10, "discountType": "PERCENTAGE" }`
- GET `/coupons` [protegido]
  - Query: `{ withCount?, page?, perPage?, code? }`
  - Resposta: `items` ou `{ items, count, page, perPage }`
 - GET `/coupons/:id` [protegido] → `coupon`
- PATCH `/coupons/:id` [protegido]
  - Body (parcial): `{ description?, discount?, discountType?, imageUrl?, quantity? }`
  - Resposta: `coupon`
- DELETE `/coupons/:id` [protegido] → 204
  - Exemplo (create resposta): `{ "id": "coup_1", "code": "PROMO10", "discount": 10, "discountType": "PERCENTAGE" }`
  - Exemplo (list resposta): `{ "items": [{ "id": "coup_1", "code": "PROMO10" }], "count": 1, "page": 1, "perPage": 10 }`
  - Exemplo (get resposta): `{ "id": "coup_1", "code": "PROMO10", "discount": 10 }`

Caixa (Cash Register)
 - GET `/cash-session/open` [protegido] → sessão aberta da unidade (ou `null`)
 - POST `/cash-session/open` [protegido]
  - Body: `{ initialAmount(number) }`
  - Exemplo: `{ "initialAmount": 200 }`
 - PUT `/cash-session/close` [protegido] → fecha a sessão atual
 - GET `/cash-session` [protegido] → lista sessões (array)
  - Exemplos (respostas):
    - GET `/cash-session/open`: `{ "id": "sess_1", "initialAmount": 200, "finalAmount": 350, "status": "OPEN" }` ou `null`
    - POST `/cash-session/open`: `{ "id": "sess_2", "initialAmount": 150, "finalAmount": 150, "status": "OPEN" }`
    - PUT `/cash-session/close`: `{ "id": "sess_2", "initialAmount": 150, "finalAmount": 420, "status": "CLOSED" }`
    - GET `/cash-session`: `[{ "id": "sess_1", "status": "CLOSED" }, { "id": "sess_2", "status": "OPEN" }]`

Empréstimos
- POST `/loans` [protegido]
  - Body: `{ amount(number) }`
  - Exemplo: `{ "amount": 300 }`
- GET `/users/:userId/loans` [protegido] → `{ loans }`
- PATCH `/loans/:id/status` [protegido] (ADMIN/MANAGER/OWNER)
  - Body: `{ status: 'PENDING'|'APPROVED'|'PAID'|... }`
  - Exemplo: `{ "status": "APPROVED" }`
  - Resposta: `{ loan, transactions }`
- PATCH `/loans/:id/pay` [protegido]
  - Body: `{ amount(number) }`
  - Exemplo: `{ "amount": 150 }`
  - Resposta: `{ transactions, remaining }`

Transações/Comissões
- POST `/pay/transactions` [protegido]
  - multipart/form-data (arquivo: `receipt`)
  - Body: `{ description?, amount? (>0), saleItemIds? (string[]|JSON), appointmentServiceIds? (string[]|JSON), affectedUserId, discountLoans? (boolean) }`
  - Exemplo (form-data): `receipt: <comprovante.png>`, `amount: 120`, `saleItemIds: ["saleItemId1","saleItemId2"]`, `affectedUserId: "user_id"`
  - Permissões: `MANAGE_USER_TRANSACTION_WITHDRAWAL` e `MANAGE_OTHER_USER_TRANSACTION`
  - Resposta: `{ transactions: Transaction[] }`
- GET `/pay/pending/:userId` [protegido]
  - Exige permissão MANAGE_OTHER_USER_TRANSACTION
  - Resposta: `{ saleItemsRecords, totalCommission, loans, outstanding }`
- GET `/transactions` [protegido]
  - Resposta: `Transaction[]`
  - Exemplo (POST /pay/transactions resposta): `{ "transactions": [{ "id": "tx_1", "amount": 120, "type": "WITHDRAWAL" }] }`
  - Exemplo (GET /pay/pending/:userId): `{ "saleItemsRecords": [{ "id": "si_1", "commission": 20 }], "totalCommission": 200, "loans": [{ "id": "loan_1", "remaining": 100 }], "outstanding": 100 }`
  - Exemplo (GET /transactions): `[{ "id": "tx_1", "amount": 120, "type": "WITHDRAWAL" }]`

Permissões e Papéis
- Permissões:
  - POST `/permissions` [protegido]
    - Body: `{ name(PermissionName), category(PermissionCategory) }`
    - Exemplo (request): `{ "name": "MANAGE_OTHER_USER_TRANSACTION", "category": "FINANCE" }`
  - GET `/permissions` [protegido] → `permissions`
  - PUT `/permissions/:id` [protegido]
    - Body: `{ name?, category? }`
- Papéis:
  - POST `/roles` [protegido]
    - Body: `{ name, permissionIds: string[] }`
    - Exemplo (request): `{ "name": "BARBER", "permissionIds": ["perm_1","perm_2"] }`
  - GET `/roles` [protegido] → `roles`
  - PUT `/roles/:id` [protegido]
    - Body: `{ name?, permissionIds? }`

Organizações
- POST `/organizations` [protegido]
  - Body: `{ name, slug }`
  - Exemplo (request): `{ "name": "Barber Co.", "slug": "barber-co" }`
- GET `/organizations` [protegido] → `organizations`
- GET `/organizations/:id` [protegido] → `organization`
- PUT `/organizations/:id` [protegido]
  - Body: `{ name, slug? }`
  - Exemplo (request): `{ "name": "Barber Company" }`
- DELETE `/organizations/:id` [protegido] → 204

Unidades
- POST `/units` [protegido]
  - Body: `{ name, slug, organizationId?, allowsLoan?, loanMonthlyLimit?, appointmentFutureLimitDays? }`
  - Exemplo (request): `{ "name": "Unidade Centro", "slug": "centro", "allowsLoan": true, "loanMonthlyLimit": 500 }`
- GET `/units` [protegido] → `units`
- GET `/units/:id` [protegido] → `unit`
- PUT `/units/:id` [protegido]
  - Body: `{ name?, slug?, allowsLoan?, loanMonthlyLimit?, appointmentFutureLimitDays? }`
  - Exemplo (request): `{ "allowsLoan": true, "loanMonthlyLimit": 800 }`
- DELETE `/units/:id` [protegido] → 204

Horários de funcionamento da unidade
- POST `/units/:unitId/opening-hours`, DELETE `/units/:unitId/opening-hours/:id`, GET `/units/opening-hours` [protegido]
  - Exemplo (POST): `{ "weekDay": 1, "startHour": "09:00", "endHour": "18:00" }`
  - Exemplo (GET): `{ "openingHours": [{ "id": "uoh_1", "weekDay": 1, "startHour": "09:00", "endHour": "18:00" }] }`

Planos
- POST `/plans` [protegido]
  - Body: `{ name, price, typeRecurrenceId, benefitIds?[], unitId? }`
  - `unitId` é ignorado para usuários comuns; ADMIN pode informar outro ID de unidade.
  - Exemplo (request ADMIN): `{ "name": "Plano Gold", "price": 99.9, "typeRecurrenceId": "rec_mensal", "benefitIds": ["ben_1"], "unitId": "unit_2" }`
  - Resposta: `{ "plan": { "id": "plan_1", "name": "Plano Gold", "price": 99.9, "unitId": "unit_2" } }`
- GET `/plans` [protegido]
  - Sempre retorna apenas os planos da unidade do usuário.
  - ADMIN pode filtrar outra unidade via query `?unitId=<id>`.
  - Resposta: `[{ "id": "plan_1", "name": "Plano Gold", "unitId": "unit_1" }]`
- GET `/plans/:id` [protegido]
  - 404 se o plano não existir.
  - 403 quando o plano pertence a outra unidade e o usuário não é ADMIN.
- PATCH `/plans/:id` [protegido]
  - Body: `{ name?, price?, typeRecurrenceId?, benefitIds?[], unitId? }`
  - `unitId` só é aplicado para ADMIN.
  - Resposta: `plan`
- DELETE `/plans/:id` [protegido]
  - Exige que o plano pertença à unidade do usuário (ou perfil ADMIN).

Contas a receber (Debts)
- POST `/debts` [protegido]
  - Body: `{ value(number), planId, planProfileId, status(PaymentStatus), paymentDate(date)?, dueDate(date) }`
  - Resposta: `{ debt }`
- GET `/debts` [protegido]
  - Query: `{ withCount?, page?, perPage?, status?, planId?, planProfileId?, from(date)?, to(date)? }`
  - Resposta: `items` ou `{ items, count, page, perPage }`
- GET `/debts/:id` [protegido] → `debt`
- PATCH `/debts/:id` [protegido]
  - Body: `{ value?, status?, paymentDate? }`
  - Resposta: `debt`
- PATCH `/debts/:id/pay` [protegido] → `{ transaction }`
- DELETE `/debts/:id` [protegido] → 204

Benefícios
- POST `/benefits` [protegido]
  - Body: `{ name, description?, discount(number), discountType: 'PERCENTAGE'|'VALUE', categories?[], services?[], products?[], plans?[] }`
  - Resposta: `{ benefit }`
- GET `/benefits` [protegido]
  - Query: `{ withCount?, page?, perPage?, name? }`
  - Resposta: `items` ou `{ items, count, page, perPage }`
- GET `/benefits/:id` [protegido] → `benefit`
- PATCH `/benefits/:id` [protegido]
  - Body: `{ name?, description?, discount?, discountType?, categories?[], services?[], products?[], plans?[] }`
  - Resposta: `benefit`
- DELETE `/benefits/:id` [protegido] → 204

Tipos de recorrência
- POST `/type-recurrences` [protegido]
  - Body: `{ period(number) }`
  - Resposta: `{ typeRecurrence }`
- GET `/type-recurrences` [protegido] → `types`
- GET `/type-recurrences/:id` [protegido] → `typeRecurrence`
- PATCH `/type-recurrences/:id` [protegido]
  - Body: `{ period? }`
  - Resposta: `typeRecurrence`
- DELETE `/type-recurrences/:id` [protegido] → 204

Relatórios
 - GET `/reports/sales` [protegido]
  - Query: `{ startDate(date), endDate(date) }`
  - Exemplo (resposta): `{ "total": 1500, "byMethod": { "CASH": 800, "PIX": 700 } }`
 - GET `/reports/barber/:barberId/balance` [protegido] → `{ balance, historySales }`
  - Exemplo: `{ "balance": 320.5, "historySales": [{ "date": "2025-01-01", "value": 200 }] }`
 - GET `/reports/owner/:ownerId/balance` [protegido] → `{ balance, historySales }`
 - GET `/reports/cash-session/:sessionId` [protegido] → relatório da sessão
  - Exemplo: `{ "session": { "id": "sess_1", "initialAmount": 200, "finalAmount": 350 }, "sales": [{ "id": "sale_1", "total": 120.5 }], "transactions": [{ "id": "tx_1", "amount": 50 }] }`
 - GET `/reports/unit/:unitId/loan-balance` [protegido] → `{ borrowed, paid }`
 - GET `/reports/user/:userId/products` [protegido] → `items`
  - Exemplo: `[{ "productId": "prd_1", "quantity": 5 }]`

Vendas
 - POST `/sales` [protegido]
  - Body: `{ method(PaymentMethod), clientId, observation? }`
  - Resposta: `sale`
  - Exemplo (request): `{ "method": "PIX", "clientId": "usr_client_1", "observation": "Venda balcão" }`
  - Exemplo (resposta): `{ "id": "sale_1", "method": "PIX", "paymentStatus": "PENDING", "clientId": "usr_client_1", "total": 0, "items": [] }`
 - GET `/sales` [protegido]
  - Query: `{ withCount?, page?, perPage?, paymentStatus?, method?, from(date)?, to(date)?, clientId?, userId? }`
  - Resposta: `items` ou `{ items, count, page, perPage }`
  - Exemplo (withCount=true): `{ "items": [{ "id": "sale_1", "total": 120.5 }], "count": 1, "page": 1, "perPage": 10 }`
 - GET `/sales/:id` [protegido] → `sale` (404 se não existir)
  - Exemplo: `{ "id": "sale_1", "paymentStatus": "PAID", "items": [{ "id": "si_1", "productId": "prd_1", "quantity": 1, "price": 15 }] }`
 - PATCH `/sales/:id` [protegido]
  - Body: `{ observation?, method? }`
  - Resposta: `sale`
 - PATCH `/sales/:id/saleItems` [protegido]
  - Body: `{ addItems?: { serviceId?|productId?|appointmentId?|planId?, quantity, barberId?, couponId?, customPrice? }[], removeItemIds?: string[] }`
  - Resposta: `sale`
 - PATCH `/sales/:id/coupon` [protegido]
  - Body: `{ couponCode? | couponId?, removeCoupon? }`
  - Resposta: `sale`
 - PATCH `/sales/:id/pay` [protegido] → confirma pagamento (sem body) → `sale`
 - PATCH `/sales/:id/client` [protegido]
  - Body: `{ clientId? }`
  - Resposta: `sale`
 - PATCH `/sales/saleItem/:id` [protegido] (atualização combinada)
  - Body: `{ serviceId? | productId? | appointmentId? | planId?, quantity?, barberId?, couponId? | couponCode?, customPrice? }`
  - Resposta: `{ sale, saleItems }`
 - PATCH `/sales/saleItem/:id/coupon` [protegido]
  - Body: `{ couponId? | couponCode? }`
  - Resposta: `{ sale, saleItems }`
 - PATCH `/sales/saleItem/:id/barber` [protegido]
  - Body: `{ barberId: string | null }`
  - Resposta: `{ sale, saleItems }`
 - PATCH `/sales/saleItem/:id/quantity` [protegido]
  - Body: `{ quantity: number }`
  - Resposta: `{ sale, saleItems }`
 - PATCH `/sales/saleItem/:id/custom-price` [protegido]
  - Body: `{ customPrice: number | null }`
  - Resposta: `{ sale, saleItems }`

Config
- GET `/config/export/users` [protegido]
  - Exemplo (resposta): `[{ "id": "usr_1", "name": "João", "email": "joao@ex.com" }]`

1) Autenticação/Perfil
- POST /sessions → { token, user, roles? }
- POST /forgot-password
- POST /reset-password
- GET /profile
- PUT /profile e/ou PUT /profile/:id
Frontend: next-auth (Credentials) em src/auth/options.ts; sincronização de sessão → cookies HttpOnly via /api/session-sync.

2) Agenda e Disponibilidade
- POST /create/appointment
- GET /appointments
- GET /appointment-barbers
- PATCH /appointments/:id
- POST /profile/:profileId/work-hours
- POST /profile/:profileId/blocked-hours
- DELETE /profile/:profileId/work-hours/:id
- DELETE /profile/:profileId/blocked-hours/:id
Frontend: a implementar (features/appointments/*, features/work-hours/*).

Colaboradores
- GET `/collaborators/me/dashboard` [protegido]
  - Resposta: `{ totalBalance, saleItems, transactions }`
  - Exemplo (resposta): `{ "totalBalance": 320.5, "saleItems": [{ "id": "si_1", "commission": 20 }], "transactions": [{ "id": "tx_1", "amount": 120 }] }`
- GET `/collaborator/users/:userId/pending-commission-sale-items` [protegido]
  - Resposta: `SaleItem[]`
- GET `/collaborator/users/:userId/pending-commission-appointments` [protegido]
  - Resposta: `Appointment[]`

3) PDV/Vendas
- POST /sales
- GET /sales
- GET /sales/:id
- PATCH /sales/:id
- PATCH /sales/:id/saleItems
- PATCH /sales/:id/coupon
- PATCH /sales/:id/pay
- PATCH /sales/:id/client
- PATCH /sales/saleItem/:id
- PATCH /sales/saleItem/:id/coupon
- PATCH /sales/saleItem/:id/barber
- PATCH /sales/saleItem/:id/quantity
- PATCH /sales/saleItem/:id/custom-price
Frontend: a implementar (features/sales/*).

4) Planos, Recorrências e Benefícios
- Planos: POST /plans, GET /plans, GET /plans/:id, PATCH /plans/:id, DELETE /plans/:id (por unidade; ADMIN pode informar `unitId`)
- Tipos de Recorrência: POST /type-recurrences, GET /type-recurrences, GET /type-recurrences/:id, PATCH /type-recurrences/:id, DELETE /type-recurrences/:id
- Benefícios: POST /benefits, GET /benefits, GET /benefits/:id, PATCH /benefits/:id, DELETE /benefits/:id
Frontend: a implementar (features/plans/*, features/recurrences/*, features/benefits/*).

5) Assinaturas (PlanProfiles)
- Criação/renovação via vendas: POST /sales e PATCH /sales/:id/pay
- Ações diretas: PATCH `/plan-profiles/:id/cancel`, PATCH `/plan-profiles/:id/renew`
- Débitos: GET /debts, GET /debts/:id, PATCH /debts/:id/pay
Frontend: a implementar (features/subscriptions/*) — consumir via sales/debts/plan-profiles.
  - Exemplos:
    - PATCH `/plan-profiles/:id/cancel` → `{ "id": "pp_1", "status": "CANCELED" }`
    - PATCH `/plan-profiles/:id/renew` → `{ "id": "pp_1", "status": "ACTIVE", "expiresAt": "2025-02-01T00:00:00.000Z" }`

6) Débitos de Plano
- POST /debts
- GET /debts
- GET /debts/:id
- PATCH /debts/:id
- PATCH /debts/:id/pay
- DELETE /debts/:id
Frontend: a implementar (features/debts/*).

7) Histórico e Documentos
- GET /sales (vendas)
- GET /sales/:id
Frontend: a implementar (features/sales/*).

8) Serviços/Produtos/Categorias/Estoque
- Serviços (barber-shop):
  - POST /create/service
  - GET /services
- Produtos:
  - POST /products (upload image)
  - GET /products
  - GET /products/:id
  - PATCH /products/:id
  - DELETE /products/:id
  - GET /product-sellers
- Categorias:
  - POST /categories
  - GET /categories
  - PATCH /categories/:id
Frontend: IMPLEMENTADO (v1)
  - features/products/{schemas.ts, api.ts}, actions/product.ts
  - features/services/{schemas.ts, api.ts}, actions/service.ts
  - features/categories/{schemas.ts, api.ts}, actions/category.ts
  - pages/templates: List/Register/Detail para products, services, categories

9) Cupons
- POST /coupons
- GET /coupons
- GET /coupons/:id
- PATCH /coupons/:id
- DELETE /coupons/:id
Frontend: IMPLEMENTADO (v1)
  - features/coupons/{schemas.ts, api.ts}, actions/coupon.ts
  - pages/templates: List/Register/Detail de cupons

10) Caixa & Transações
- Caixa:
  - GET /cash-session/open
  - POST /cash-session/open
  - PUT /cash-session/close
  - GET /cash-session
- Transações/Comissões:
  - POST /pay/transactions (anexa receipt)
  - GET /pay/pending/:userId
  - GET /transactions
Frontend: a implementar (features/cash-session/*, features/transactions/*, features/commissions/*).

11) Empréstimos
- POST /loans
- GET /users/:userId/loans
- PATCH /loans/:id/status
- PATCH /loans/:id/pay
Frontend: a implementar (features/loans/*).

12) Clientes & Perfis
- GET /profile
- POST /create/profile
- PUT /profile/:id
- PUT /profile
- GET /clients
  - Query: `{ name? }` (ex.: `GET /clients?name=jo`)
  - Exemplo (resposta): `[{ "id": "usr_3", "name": "Joaquina" }]`
Frontend: parte existente (users/profile), precisa migrar para novo contrato quando disponível (features/profiles/*).

13) Usuários/Barbeiros
- Admin/Auth:
  - POST /users (criação)
- Barbeiros:
  - POST /barber/users, GET /barber/users, GET /barber/users/:id, PUT /barber/users/:id, DELETE /barber/users/:id
- Sessão/Unidade:
  - PATCH /sessions/unit
Frontend: já há base (users) — migrar gradualmente para novos endpoints (features/barbers/*, features/users/*, action para sessions/unit).

14) Organização & Unidades
- Organizações:
  - POST /organizations, GET /organizations, GET /organizations/:id, PATCH /organizations/:id, DELETE /organizations/:id
- Unidades:
  - POST /units, GET /units, GET /units/:id, PUT /units/:id, DELETE /units/:id
- Horários de Abertura:
  - POST /units/:unitId/opening-hours
  - DELETE /units/:unitId/opening-hours/:id
  - GET /units/opening-hours
Frontend: parcialmente implementado; migrar para features/organizations/* e features/units/* (já existe base para units v1).

15) Papéis & Permissões
- Papéis: POST /roles, GET /roles, PUT /roles/:id
- Permissões: POST /permissions, GET /permissions, PUT /permissions/:id
Frontend: a implementar (features/roles/*, features/permissions/*). Middleware já normaliza role name.

16) Relatórios & Dashboard
 - GET /reports/sales (query: startDate, endDate)
- GET /reports/barber/:barberId/balance
- GET /reports/owner/:ownerId/balance
- GET /reports/cash-session/:sessionId
- GET /reports/unit/:unitId/loan-balance
- GET /reports/user/:userId/products
- Indicadores (base para dashboard): GET /sales, GET /appointments, GET /debts, GET /reports/*
Frontend: a implementar (features/reports/*, features/dashboard/*). Já existe base para gráficos em features/graphics.

17) Configurações & Integrações
- GET /config/export/users
- GET /health
Frontend: a implementar (features/config/*, features/health/*).

Mapa Frontend (status)
- Auth: OK (NextAuth Credentials + cookies HttpOnly)
- Products: OK (List/Register/Detail + CRUD)
- Coupons: OK (List/Register/Detail + CRUD)
- Services: OK (List/Register/Detail + CRUD)
- Categories: OK (List/Register/Detail + CRUD)
- Units: Parcial (List/Detail/Register v1)
- Segments/Courses: Parcial (v1)
- Leads: Parcial (v1)
- Demais domínios: pendente

Próximos passos sugeridos
1) Consolidar “response shapes” do backend para todos os recursos (usar { list, count } e { item }).
2) Migrar endpoints prioritários: appointments, sales, debts.
3) Criar features/* para cada domínio pendente (schemas + api) e refatorar actions (server) consumindo-os.
4) Atualizar templates/páginas conforme novos contratos.
- Exemplos:
  - POST `/permissions` resposta: `{ "id": "perm_1", "name": "MANAGE_OTHER_USER_TRANSACTION", "category": "FINANCE" }`
  - GET `/permissions` resposta: `[{ "id": "perm_1", "name": "MANAGE_OTHER_USER_TRANSACTION" }]`
  - POST `/roles` resposta: `{ "id": "role_1", "name": "BARBER", "permissions": ["MANAGE_SELF_SALES"] }`
  - GET `/roles` resposta: `[{ "id": "role_1", "name": "BARBER" }]`
- Exemplos:
  - POST resposta: `{ "id": "org_1", "name": "Barber Co.", "slug": "barber-co" }`
  - GET list resposta: `[{ "id": "org_1", "name": "Barber Co." }]`
  - GET by id resposta: `{ "id": "org_1", "name": "Barber Co.", "slug": "barber-co" }`
  - PUT resposta: `{ "id": "org_1", "name": "Barber Company", "slug": "barber-co" }`
- Exemplos:
  - POST resposta: `{ "id": "unit_1", "name": "Unidade Centro", "slug": "centro" }`
  - GET list resposta: `[{ "id": "unit_1", "name": "Unidade Centro" }]`
  - GET by id resposta: `{ "id": "unit_1", "name": "Unidade Centro", "allowsLoan": true }`
  - PUT resposta: `{ "id": "unit_1", "allowsLoan": true, "loanMonthlyLimit": 500 }`
- Exemplos:
  - POST (request): `{ "value": 99.9, "planId": "plan_1", "planProfileId": "pp_1", "status": "PENDING", "dueDate": "2025-01-31T00:00:00.000Z" }`
  - POST (resposta): `{ "debt": { "id": "debt_1", "value": 99.9, "status": "PENDING" } }`
  - GET list (resposta): `{ "items": [{ "id": "debt_1", "status": "PENDING" }], "count": 1, "page": 1, "perPage": 10 }`
  - GET by id (resposta): `{ "id": "debt_1", "value": 99.9, "status": "PENDING" }`
  - PATCH (resposta): `{ "id": "debt_1", "status": "PAID", "paymentDate": "2025-01-15T00:00:00.000Z" }`
  - PATCH /debts/:id/pay (resposta): `{ "transaction": { "id": "tx_10", "amount": 99.9 } }`
- Exemplos:
  - POST (request): `{ "name": "10% Off", "discount": 10, "discountType": "PERCENTAGE", "services": ["srv_1"] }`
  - POST (resposta): `{ "benefit": { "id": "ben_1", "name": "10% Off", "discountType": "PERCENTAGE" } }`
  - GET list (resposta): `{ "items": [{ "id": "ben_1", "name": "10% Off" }], "count": 1, "page": 1, "perPage": 10 }`
  - GET by id (resposta): `{ "id": "ben_1", "name": "10% Off", "services": ["srv_1"] }`
  - PATCH (resposta): `{ "id": "ben_1", "name": "10% Off (Produtos)" }`
- Exemplos:
  - POST (request): `{ "period": 30 }`
  - POST (resposta): `{ "typeRecurrence": { "id": "rec_mensal", "period": 30 } }`
  - GET list (resposta): `[{ "id": "rec_mensal", "period": 30 }]`
  - GET by id (resposta): `{ "id": "rec_mensal", "period": 30 }`
  - PATCH (resposta): `{ "id": "rec_mensal", "period": 45 }`

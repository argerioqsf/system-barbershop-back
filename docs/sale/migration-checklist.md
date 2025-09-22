# Sale Migration Checklist

## Pre-merge validation
- [ ] Run `npm test` and ensure all suites (unit, module and integration) pass.
- [ ] Run `npm run typecheck` and `npm run lint`.
- [ ] For HTTP integration coverage run `npm test -- sale-http.spec.ts`.
- [ ] Verify no controllers import legacy services under `src/services/sale`.

## Deployment plan
1. Apply database migrations (none required if schema unchanged).
2. Deploy application package to staging.
3. Update environment variables if new ones were introduced (none for current scope).

## Post-deploy validation (staging)
- [ ] Create sale through `/sales` endpoint and confirm response payload includes `id`.
- [ ] PATCH `/sales/:id` to change payment method/observation and verify data persists.
- [ ] PATCH `/sales/:id/pay` and ensure sale transitions to `PAID` and downstream side-effects (commissions, transactions) trigger.
- [ ] Exercise item update endpoints (`/sales/saleItem/:id/*`) to ensure coordinator flow works with real data.
- [ ] Check logs/telemetry for `sale.created`, `sale.list`, `sale.viewed` events.

## Rollback strategy
- Tag current production revision before deploy.
- If blocking issue arises, redeploy previous tag and restore `src/services/sale` legacy services (they remain in git history).
- Re-run post-deploy smoke tests to ensure legacy flow is healthy.

## Communication
- Share migration notes with the squad via Slack and schedule a walkthrough of the new module architecture.
- Update onboarding materials to point to `docs/sale/flow-overview.md` and this checklist.

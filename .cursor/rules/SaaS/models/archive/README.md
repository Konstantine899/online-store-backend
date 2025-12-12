# Архив устаревших планов

Эти файлы перемещены в архив, т.к. они **противоречили** основному SaaS плану (`saas.plan.mdc`).

## Причина архивирования:

- `user.plan.mdc` - содержал e-commerce специфичные задачи (VIP, Premium, Wholesale, Employee, Affiliate, HighValue)
- `user-atomic.plan.mdc` - избыточная детализация, дублирующая логику
- `user.mdc` - документация с хардкодом бизнес-ролей

## Текущий статус:

**ЕДИНСТВЕННЫЙ источник правды для SaaS разработки:**

```
.cursor/rules/SaaS/saas.plan.mdc
```

Он содержит **только необходимые** задачи для MVP SaaS:

- SAAS-001: Multi-tenancy (✅ выполнено)
- SAAS-002: User module MVP cleanup (универсальный User без e-commerce хардкода)
- SAAS-003: Catalog tenant filters and pagination

---

**Дата архивирования:** 2025-10-14
**Причина:** Упрощение и устранение противоречий в планах разработки SaaS приложения.

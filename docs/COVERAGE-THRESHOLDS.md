# Coverage Thresholds Configuration

## Текущее состояние (2025-10-11)

### Global Coverage
```
Lines:      73.73% ✅ (target: 70%)
Statements: 73.73% ✅ (target: 70%)
Functions:  62.07% ✅ (target: 60%)
Branches:   72.43% ✅ (target: 70%)
```

## Per-Module Thresholds

### CRITICAL Modules (High Priority)

#### 1. Auth Services
**Path:** `./src/infrastructure/services/auth/**/*.ts`

| Metric | Target | Rationale |
|--------|--------|-----------|
| Branches | 65% | High security impact |
| Functions | 75% | Core auth logic |
| Lines | 85% | Security critical |
| Statements | 85% | Security critical |

#### 2. Security Guards
**Path:** `./src/infrastructure/common/guards/**/*.ts`

| Metric | Target | Rationale |
|--------|--------|-----------|
| Branches | 35% | ⚠️ role.guard.ts has low branch coverage (38%), needs improvement |
| Functions | 75% | Authorization logic |
| Lines | 60% | Core security |
| Statements | 60% | Core security |

**Note:** role.guard.ts has low branch coverage (38.46%), gradual improvement needed.

#### 3. Exception Filters
**Path:** `./src/infrastructure/exceptions/*filter.ts`

| Metric | Target | Rationale |
|--------|--------|-----------|
| Branches | 65% | Error handling reliability |
| Functions | 75% | Error processing |
| Lines | 85% | Comprehensive coverage |
| Statements | 85% | Comprehensive coverage |

**Note:** Barrel exports (`index.ts`) excluded from coverage (no logic).

### HIGH Priority Modules

#### 4. User Services
**Path:** `./src/infrastructure/services/user/**/*.ts`

| Metric | Target | Rationale |
|--------|--------|-----------|
| Branches | 80% | Core business logic |
| Functions | 85% | User management |
| Lines | 85% | High importance |
| Statements | 85% | High importance |

#### 5. Token Services
**Path:** `./src/infrastructure/services/token/**/*.ts`

| Metric | Target | Rationale |
|--------|--------|-----------|
| Branches | 75% | Security critical |
| Functions | 90% | Token operations |
| Lines | 90% | High security |
| Statements | 90% | High security |

**Note:** Actual coverage 75.92% branches, 96.75% lines.

### MEDIUM Priority Modules

#### 6. Controllers
**Path:** `./src/infrastructure/controllers/**/*.ts`

| Metric | Target | Rationale |
|--------|--------|-----------|
| Branches | 10% | ⚠️ Very low, gradual improvement needed |
| Functions | 14% | ⚠️ Very low, gradual improvement needed |
| Lines | 45% | Conservative baseline |
| Statements | 45% | Conservative baseline |

**Note:** Many controllers have very low coverage:
- product: 10.71% branches, 30% functions
- notification: 14.28% functions
- order: 15.38% branches
- login-history: 20% branches, 48.78% lines

**Strategy:** Gradual improvement - add tests in future phases.

## Excluded from Coverage

The following are excluded from coverage collection (no logic):
- `**/*dto.ts` - Data Transfer Objects
- `**/*interface.ts` - TypeScript interfaces
- `**/*response.ts` - Response models
- `**/*request.ts` - Request models
- `**/index.ts` - Barrel exports
- `**/*constants.ts` - Constants
- `**/types.ts` - Type definitions

## CI/CD Integration

Coverage thresholds are enforced in CI:
```bash
npm run test:cov
```

**CI will fail if:**
- Global coverage falls below thresholds
- Critical/High priority modules fall below thresholds
- Medium priority modules fall below thresholds

## Gradual Improvement Strategy

### Phase 1 (Current) - Baseline Established
- ✅ Global thresholds: 60-70%
- ✅ Critical modules: 35-85%
- ✅ Controllers: 10-45% (very conservative)

### Phase 2 (Next 3 months)
- 🎯 Improve controllers coverage: 20-60%
- 🎯 Improve role.guard branches: 50%+
- 🎯 Global: 65-75%

### Phase 3 (6 months)
- 🎯 Controllers: 40-70%
- 🎯 All critical modules: 85%+
- 🎯 Global: 75%+

## Monitoring

Track coverage trends:
```bash
# Generate coverage report
npm run test:cov

# View HTML report
open coverage/index.html

# Check specific module
npm run test:cov -- src/infrastructure/services/auth
```

## Contributing

When adding new code:
1. **Critical modules:** Maintain ≥85% coverage
2. **High priority:** Maintain ≥80% coverage
3. **Medium priority:** Maintain ≥40% coverage (gradual improvement)

**Don't lower thresholds** - improve test coverage instead!


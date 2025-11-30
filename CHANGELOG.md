# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

#### SAAS-017-15: Full Role Module Optimization (Variant B) (2025-11-30)

**Performance Optimization:**
- Implemented Redis centralized caching for user roles with graceful degradation
- Added `UserRolesCacheService` with TTL (1 hour) and automatic invalidation
- Optimized `RoleRepository.findUserRoles()` with explicit attribute selection (reduces data transfer)
- Implemented `Promise.all` for parallel operations in `assignRoleToUser`, `revokeRoleFromUser`, `autoAssignRoleByThreshold`
- Added performance monitoring interceptor for slow requests (>500ms threshold)

**Redis Integration:**
- Created `RedisModule` with `ioredis` client, retry strategy, and graceful error handling
- Added `RedisService` with methods: `get`, `set`, `del`, `delPattern`, `exists`, `ttl`
- Configured Redis with key prefixes (`user-roles:`), connection pooling, and lazyConnect
- Redis failures don't break the application (cache miss fallback to DB)

**Caching Strategy:**
- `UserRolesCacheService.getUserRoles()` - retrieves cached roles or fetches from DB
- `UserRolesCacheService.setUserRoles()` - caches roles with 1-hour TTL
- `UserRolesCacheService.invalidateUserRoles()` - invalidates on role assignment/revocation
- `UserRolesCacheService.invalidateByRoleId()` - invalidates all users with specific role on role update/delete
- `RoleService.getUserRoles()` - integrated cache-first strategy with automatic cache population

**Performance Monitoring:**
- `PerformanceMonitoringInterceptor` logs slow requests with correlation ID and duration
- Added API endpoints for performance stats (protected by SUPER_ADMIN/PLATFORM_ADMIN):
  - `GET /role/performance/slow-queries` - list of slow requests (last 100)
  - `GET /role/performance/stats` - average/max/min response times
  - `POST /role/performance/clear` - clear performance statistics

**Database Optimization:**
- Explicitly selected attributes in `findUserRoles` query (9 fields instead of `SELECT *`)
- Added `userId` to selected attributes for proper join relationships
- Maintained existing indexes from Variant A (role, isSystemRole, userId, tenantId, roleId)

**Code Quality:**
- Fixed all linter errors (optional chaining, missing return types, unused parameters)
- Updated unit tests for `RoleService` and `role-auto-assign` to mock new cache dependencies
- Fixed test for removed `reload()` call in `RoleRepository.createRole()`
- All 236 role module tests passing (100% pass rate)

**Files Added:**
- `src/infrastructure/config/redis.config.ts` - Redis connection configuration
- `src/infrastructure/common/redis/redis.module.ts` - NestJS Redis module
- `src/infrastructure/common/redis/redis.service.ts` - Redis client wrapper
- `src/infrastructure/common/redis/redis.constants.ts` - Redis key prefixes and constants
- `src/infrastructure/common/redis/index.ts` - Barrel export
- `src/infrastructure/services/role/user-roles-cache.service.ts` - User roles caching service
- `src/infrastructure/common/interceptors/performance-monitoring.interceptor.ts` - Performance monitoring

**Files Modified:**
- `src/app.module.ts` - integrated RedisModule
- `src/infrastructure/services/services.module.ts` - added UserRolesCacheService
- `src/infrastructure/services/role/role.service.ts` - integrated caching and Promise.all
- `src/infrastructure/repositories/role/role.repository.ts` - optimized findUserRoles query
- `src/infrastructure/controllers/role/role.controller.ts` - added performance endpoints
- `src/infrastructure/controllers/controllers.module.ts` - added PerformanceMonitoringInterceptor

**Test Coverage:**
- Updated 2 test files with new cache service mocks
- All existing tests maintained (236/236 passing)
- No new test files required (Redis service uses existing infrastructure)

**Performance Impact:**
- Cache hit: ~5-10ms (Redis lookup)
- Cache miss: ~50-100ms (DB query + cache population)
- Parallel operations: ~30% faster for multi-step flows
- Slow query monitoring: identifies endpoints exceeding 500ms threshold

#### SAAS-017-14.3: Advanced Scenarios Integration Tests (2025-11-29)

**Test Coverage Enhancement:**
- Added 4 new integration tests for advanced role assignment scenarios
- 100% pass rate (4/4 tests, execution time: ~1.2s)
- Tests cover metadata, expiresAt, role guard, and combo scenarios

**New Test Coverage:**
- `POST /role/assign - 201: назначение роли с metadata` (checks metadata persistence)
- `POST /role/assign - 201: назначение временной роли (expiresAt)` (checks expiration date)
- `POST /role/assign - 403: CUSTOMER не может назначать роли` (RoleGuard validation)
- `POST /role/assign - 201: назначение роли с metadata и expiresAt` (combined scenario)

**Infrastructure Improvements:**
- Added `roleId` field to `UserRoleInfo` response (enables role lookup in GET responses)
- Added `metadata` field to `UserRoleInfo` response (optional, JSON type)
- Updated `RoleRepository.findUserRoles()` to return `metadata` field
- Updated `RoleService.getUserRoles()` to map `roleId` and `metadata`

**Test Scripts:**
- `test-role-advanced.ps1` - PowerShell script with detailed logging (Windows)
- `test-role-advanced.sh` - Bash script with detailed logging (Linux/Mac)
- Automatic test summary extraction, colored output, exit code handling

**Quality Improvements:**
- Renamed hierarchy test for clarity (RoleGuard vs service hierarchy check)
- Added detailed comments explaining RoleGuard blocking behavior
- Verified metadata/expiresAt persistence through GET /role/user/:userId
- Used `randomUUID()` for unique test data to prevent conflicts

#### SAAS-017-13: Complete Unit Tests for RoleRepository (2025-11-28)

**Test Coverage Enhancement:**
- Added 14 new unit tests for RoleRepository (27 → 41 tests)
- Achieved 100% method coverage (15/15 methods)
- All 41 tests passing with 100% success rate
- Execution time: ~0.2 seconds for RoleRepository

**New Test Coverage:**
- `findRoleByName` - 2 tests (search by role name)
- `findAllRolesGrouped` - 2 tests (sorted role list)
- `updateRole` - 3 tests (role updates, tenant isolation)
- `createRolePermission` - 3 tests (permission creation, conflicts)
- `deleteRolePermission` - 2 tests (permission deletion)
- `findRolePermissions` - 2 tests (permission queries)

**Quality Improvements:**
- Fixed mock implementations for `update()` and `unscoped()`
- Improved type safety with `as unknown as Model` casting
- Added proper imports using `import type` for type-only imports
- Added missing `isSystemRole` field in test DTOs

#### SAAS-017-12: Comprehensive Tests for Role API (2025-11-28)

**Test Coverage:**
- Created 250 tests total (214 unit + 36 integration)
- Achieved ~97% code coverage (target ≥80%)
- All tests passing with 100% success rate
- Execution time: ~10 seconds for role module

**New Test Files:**
- `role.repository.unit.test.ts` - 27 comprehensive unit tests for RoleRepository

**Scripts Added:**
- `scripts/test-role-unit.sh/ps1` - Quick unit test execution
- `scripts/run-coverage.sh/ps1` - Coverage check automation
- `scripts/delete-dist.js` - Clean dist/ directory
- `scripts/clear-jest-cache.js` - Clear Jest cache

**npm Scripts:**
- `clean:dist` - Remove compiled TypeScript output
- `clean:cache` - Clear Jest cache for clean test runs

### Fixed

#### SAAS-017-12: Critical Role Module Bugs

**Sequelize Model Shadowing:**
- Fixed `isActive` returning `undefined` due to class field shadowing Sequelize getters
- Changed `public isActive!: boolean` to `declare isActive: boolean` in RoleModel and UserRoleModel
- Impact: POST /role/assign now works correctly

**404 vs 403 Priority:**
- Fixed DELETE /role/revoke returning 403 instead of 404 for non-existent roles
- Added `findRoleByIdWithoutIsolation()` check before permission validation
- Impact: Proper HTTP status codes, better API semantics

**NestJS Route Matching:**
- Fixed DELETE /role/revoke being matched to `@Delete('/:id')` instead of `@Delete('/revoke')`
- Reordered controller methods: specific routes before generic routes
- Impact: Correct endpoint routing

**Unit Test Mocks:**
- Fixed Sequelize mocks (`$or` → `Op.or`, added `destroy()`, `getDataValue()`)
- Added `jest.clearAllMocks()` in `beforeEach` to prevent test pollution
- Used `jest.spyOn()` for proper method isolation in auto-assign tests
- Impact: 14 failing tests → 0 failing tests

### Changed

#### SAAS-017-12: Code Cleanup

**Removed Diagnostic Code:**
- Removed all `console.log` statements from production code
- Cleaned up temporary test log files
- Removed obsolete `.bat` scripts

**Project Organization:**
- Moved utility scripts to `scripts/` directory
- Organized test execution scripts
- Added comprehensive documentation in `docs/SAAS-017-12-SUMMARY.md`

---

#### USER-001-11: Full Optimization of User Module (2025-11-18)

**Critical Bugfixes:**
- Fixed tenant isolation in `getUserStatistics()` (data leak vulnerability)
- Fixed tenant isolation in `findListUsersPaginated()` (data leak vulnerability)

**Database Optimization:**
- Added 8 composite indexes for tenant-isolated queries:
  - `idx_user_tenant_id_is_active` - for active/inactive user filtering
  - `idx_user_tenant_id_is_blocked` - for blocked users filtering
  - `idx_user_tenant_id_is_verified` - for verified users filtering
  - `idx_user_tenant_id_is_premium` - for premium users filtering
  - `idx_user_tenant_id_is_vip_customer` - for VIP customers filtering
  - `idx_user_tenant_id_is_deleted_is_active` - covering index for multi-condition queries
  - `idx_user_tenant_id_first_name` - for name search optimization
  - `idx_user_tenant_id_phone` - for phone search optimization
- Performance improvement: Full table scan (~500ms) → Index scan (~15-50ms)

**New API Endpoints (21 total):**

*Filtering:*
- `GET /user/active` - Active users pagination
- `GET /user/blocked` - Blocked users pagination
- `GET /user/vip` - VIP customers pagination
- `GET /user/premium` - Premium users pagination
- `GET /user/verified` - Verified users pagination

*Search:*
- `GET /user/search/name` - Search by first/last name with pagination
- `GET /user/search/phone` - Search by phone number
- `GET /user/full-text-search` - Full-text search across all user fields

*Specialized Queries:*
- `GET /user/inactive` - Inactive users (no login >90 days)
- `GET /user/incomplete-profiles` - Users with incomplete profiles
- `GET /user/date-range` - Filter users by registration date range

*Statistics:*
- `GET /user/stats` - General user statistics
- `GET /user/stats/role` - Role-based statistics with percentages
- `GET /user/stats/activity` - Activity statistics (24h/7d/30d)

*Bulk Operations:*
- `POST /user/bulk/activate` - Bulk user activation (max 1000 users)
- `POST /user/bulk/deactivate` - Bulk user deactivation
- `POST /user/bulk/block` - Bulk user blocking
- `POST /user/bulk/unblock` - Bulk user unblocking
- `POST /user/bulk/delete` - Bulk soft delete
- `POST /user/bulk/verify` - Bulk user verification

*Monitoring:*
- `GET /user/admin/metrics` - Performance metrics dashboard

**Testing:**
- Added 65 integration tests for new endpoints (100% pass rate)
- Added EXPLAIN analysis script: `scripts/explain-user-queries.ts`
- All tests validate tenant isolation and pagination

**Documentation:**
- Created comprehensive optimization documentation: `docs/USER-001-11-OPTIMIZATION.md`

**Performance Metrics:**
- Query optimization: 10-30x faster queries with indexes
- Bulk operations: ~100-150ms for 100 users, ~1.2-1.8s for 1000 users
- All queries tenant-isolated and pagination-enabled

---

#### USER-001-12: Post-merge Improvements (2025-11-20)

**Monitoring & Metrics:**
- Added SQL logging with timing in `SequelizeConfigService`:
  - Logs slow queries (>100ms warn, >1s error)
  - Truncates long SQL queries for readability
  - Disabled in test environment (unless `DEBUG_SQL=true`)
- Added timing metrics to all 6 bulk operations in repositories:
  - `bulkActivateUsers`, `bulkDeactivateUsers`, `bulkBlockUsers`
  - `bulkUnblockUsers`, `bulkDeleteUsers`, `bulkVerifyUsers`
  - Logs operation duration and affected count
- Added `GET /user/admin/metrics` endpoint with `UserMetricsResponse` DTO:
  - Slow queries count (24h)
  - Average bulk operation time
  - Bulk operations by type
  - Error rate
  - Real-time timestamp
- Added 3 integration tests for metrics endpoint (200/403/401 scenarios)

**Repository Refactoring:**
- Split `UserRepository` (2609 lines) into specialized modules:
  - `UserSearchRepository` (463 lines) - 7 search methods
  - `UserStatsRepository` (298 lines) - 3 statistics methods
  - `UserBulkRepository` (381 lines) - 6 bulk operations
  - `UserRepository` reduced to 1710 lines (-34%)
- Improved separation of concerns (SRP - Single Responsibility Principle)
- All repos use `getTenantIdSafe()` for test mode compatibility
- Configured Dependency Injection in `RepositoriesModule`

**Tenant Isolation Refactoring:**
- Extracted `getTenantIdSafe()` method to centralize tenant ID logic
- Replaced 8 duplicated tenant isolation blocks with single method call
- Improved DRY principle and test mode handling
- Consistent tenant_id retrieval across all repositories

**Utils & Testing:**
- Created `escapeLikeWildcards()` utility for SQL LIKE wildcard escaping:
  - Escapes `%`, `_`, `\` for safe SQL LIKE queries
  - Prevents SQL injection via wildcard patterns
  - Proper escape order to avoid double-escaping
- Added 105+ unit tests for `escapeLikeWildcards()`:
  - Percent, underscore, backslash escaping
  - Combined wildcards, edge cases, Unicode/emoji support
  - SQL injection prevention validation
  - Performance tests for long strings
- Existing tests for `normalizeRussianPhone()` verified (already present in `phone.utils.unit.test.ts`)

**Documentation:**
- Updated `README.md` with 21 new user endpoints
- Created `docs/api/user-bulk-operations.md` with comprehensive examples:
  - Request/response formats for all 6 bulk operations
  - Validation rules, error handling, performance metrics
  - Best practices, use cases, tenant isolation details
- Created `docs/database/indexes.md` with detailed index documentation:
  - 8 new composite indexes with query patterns
  - EXPLAIN analysis examples (before/after)
  - Index maintenance, monitoring, best practices
  - Performance testing results
- Created `CHANGELOG.md` for tracking project changes

---

## [0.1.0] - 2025-11-01

### Added

- Initial release with core e-commerce functionality
- User authentication & authorization (JWT + RBAC)
- Product management (CRUD operations)
- Shopping cart functionality
- Order processing
- 878 tests (unit + integration + E2E)
- Comprehensive Swagger documentation
- Clean Architecture structure
- Multi-tenant support
- Security testing (password reset, brute force, RBAC)

---

## Notes

### Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards-compatible)
- **PATCH** version for backwards-compatible bug fixes

### Categories

Changes are grouped by:
- **Added** - new features
- **Changed** - changes in existing functionality
- **Deprecated** - soon-to-be removed features
- **Removed** - removed features
- **Fixed** - bug fixes
- **Security** - vulnerability fixes

---

[Unreleased]: https://github.com/Konstantine899/online-store-backend/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Konstantine899/online-store-backend/releases/tag/v0.1.0


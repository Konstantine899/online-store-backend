import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { PerformanceMonitoringInterceptor } from '../performance-monitoring.interceptor';

// Type for accessing private properties in tests
interface InterceptorPrivates {
    slowQueries: Array<{
        method: string;
        route: string;
        duration: number;
        timestamp: string;
        tenantId: number | null;
    }>;
    tenantStats: Map<
        number,
        {
            slowQueryCount: number;
            totalDuration: number;
            maxDuration: number;
            avgDuration: number;
        }
    >;
}

describe('PerformanceMonitoringInterceptor (unit)', () => {
    let interceptor: PerformanceMonitoringInterceptor;

    beforeEach(() => {
        interceptor = new PerformanceMonitoringInterceptor();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('intercept()', () => {
        it('должен логировать медленные запросы (>500ms)', (done): void => {
            const mockRequest = {
                method: 'GET',
                path: '/role/user/123',
                user: { tenantId: 1, roles: [] },
            };

            const mockContext = {
                switchToHttp: (): { getRequest: () => typeof mockRequest } => ({
                    getRequest: (): typeof mockRequest => mockRequest,
                }),
            } as unknown as ExecutionContext;

            const mockNext = {
                handle: () => {
                    // Симулировать задержку >500ms
                    const startTime = Date.now();
                    while (Date.now() - startTime < 600) {
                        // busy wait
                    }
                    return of({});
                },
            } as CallHandler;

            interceptor.intercept(mockContext, mockNext).subscribe(() => {
                const slowQueries = interceptor.getSlowQueries();
                expect(slowQueries.length).toBeGreaterThan(0);
                done();
            });
        }, 10000);

        it('не должен логировать быстрые запросы (<500ms)', (done): void => {
            const mockRequest = {
                method: 'GET',
                path: '/role/list',
                user: { tenantId: 1, roles: [] },
            };

            const mockContext = {
                switchToHttp: (): { getRequest: () => typeof mockRequest } => ({
                    getRequest: (): typeof mockRequest => mockRequest,
                }),
            } as unknown as ExecutionContext;

            const mockNext = {
                handle: () => of({}),
            } as CallHandler;

            interceptor.intercept(mockContext, mockNext).subscribe(() => {
                const slowQueries = interceptor.getSlowQueries();
                expect(slowQueries.length).toBe(0);
                done();
            });
        });
    });

    describe('sanitizeRoute()', () => {
        it('должен маскировать ID в путях', (done): void => {
            const mockRequest = {
                method: 'GET',
                path: '/role/user/12345',
                user: { tenantId: 1, roles: [] },
            };

            const mockContext = {
                switchToHttp: (): { getRequest: () => typeof mockRequest } => ({
                    getRequest: (): typeof mockRequest => mockRequest,
                }),
            } as unknown as ExecutionContext;

            const mockNext = {
                handle: () => {
                    // Симулировать медленный запрос
                    const startTime = Date.now();
                    while (Date.now() - startTime < 600) {
                        // busy wait
                    }
                    return of({});
                },
            } as CallHandler;

            interceptor.intercept(mockContext, mockNext).subscribe(() => {
                const slowQueries = interceptor.getSlowQueries();
                expect(slowQueries[0].route).toBe('/role/user/:id');
                done();
            });
        }, 10000);
    });

    describe('getSlowQueries()', () => {
        it('должен фильтровать по tenantId для PLATFORM_ADMIN', (): void => {
            // Добавить mock данные вручную
            (interceptor as unknown as InterceptorPrivates).slowQueries = [
                {
                    method: 'GET',
                    route: '/role/user/:id',
                    duration: 600,
                    timestamp: new Date().toISOString(),
                    tenantId: 1,
                },
                {
                    method: 'GET',
                    route: '/role/list',
                    duration: 700,
                    timestamp: new Date().toISOString(),
                    tenantId: 2,
                },
            ];

            // PLATFORM_ADMIN (tenantId 1) видит только свои запросы
            const tenant1Queries = interceptor.getSlowQueries(1);
            expect(tenant1Queries.length).toBe(1);
            expect(tenant1Queries[0].route).toBe('/role/user/:id');

            // SUPER_ADMIN (tenantId null) видит все запросы
            const allQueries = interceptor.getSlowQueries(null);
            expect(allQueries.length).toBe(2);
        });
    });

    describe('getTenantStats()', () => {
        it('должен вернуть статистику для тенанта', (): void => {
            // Добавить mock статистику
            (interceptor as unknown as InterceptorPrivates).tenantStats =
                new Map([
                    [
                        1,
                        {
                            slowQueryCount: 5,
                            totalDuration: 3000,
                            maxDuration: 800,
                            avgDuration: 600,
                        },
                    ],
                ]);

            const stats = interceptor.getTenantStats(1);
            expect(stats.slowQueryCount).toBe(5);
            expect(stats.avgDuration).toBe(600);
            expect(stats.maxDuration).toBe(800);
        });

        it('должен вернуть пустую статистику для несуществующего тенанта', (): void => {
            const stats = interceptor.getTenantStats(999);
            expect(stats.slowQueryCount).toBe(0);
            expect(stats.avgDuration).toBe(0);
        });
    });

    describe('getTopNoisyTenants()', () => {
        it('должен вернуть топ проблемных тенантов', (): void => {
            // Добавить mock статистику
            (interceptor as unknown as InterceptorPrivates).tenantStats =
                new Map([
                    [
                        1,
                        {
                            slowQueryCount: 10,
                            totalDuration: 6000,
                            maxDuration: 800,
                            avgDuration: 600,
                        },
                    ],
                    [
                        2,
                        {
                            slowQueryCount: 5,
                            totalDuration: 2500,
                            maxDuration: 600,
                            avgDuration: 500,
                        },
                    ],
                    [
                        3,
                        {
                            slowQueryCount: 15,
                            totalDuration: 9000,
                            maxDuration: 900,
                            avgDuration: 600,
                        },
                    ],
                ]);

            const top2 = interceptor.getTopNoisyTenants(2);
            expect(top2.length).toBe(2);
            expect(top2[0].tenantId).toBe(3); // Самый проблемный
            expect(top2[0].slowQueryCount).toBe(15);
            expect(top2[1].tenantId).toBe(1); // Второй
        });

        it('должен ограничивать результат лимитом', (): void => {
            (interceptor as unknown as InterceptorPrivates).tenantStats =
                new Map([
                    [
                        1,
                        {
                            slowQueryCount: 10,
                            totalDuration: 6000,
                            avgDuration: 600,
                            maxDuration: 800,
                        },
                    ],
                    [
                        2,
                        {
                            slowQueryCount: 5,
                            totalDuration: 2500,
                            avgDuration: 500,
                            maxDuration: 600,
                        },
                    ],
                    [
                        3,
                        {
                            slowQueryCount: 15,
                            totalDuration: 9000,
                            avgDuration: 600,
                            maxDuration: 900,
                        },
                    ],
                ]);

            const top1 = interceptor.getTopNoisyTenants(1);
            expect(top1.length).toBe(1);
            expect(top1[0].tenantId).toBe(3);
        });
    });

    describe('clearTenantStats()', () => {
        it('должен очистить статистику тенантов', (): void => {
            (interceptor as unknown as InterceptorPrivates).tenantStats =
                new Map([
                    [
                        1,
                        {
                            slowQueryCount: 10,
                            totalDuration: 6000,
                            avgDuration: 600,
                            maxDuration: 800,
                        },
                    ],
                ]);

            interceptor.clearTenantStats();

            const stats = interceptor.getTenantStats(1);
            expect(stats.slowQueryCount).toBe(0);
        });
    });
});

import type { IDecodedAccessToken } from '@app/domain/jwt';
import type { RoleService } from '@app/infrastructure/services/role/role.service';
import type { ExecutionContext } from '@nestjs/common';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { TenantRoleGuard } from '../tenant-role.guard';

interface TestRequest {
    user?: IDecodedAccessToken;
    headers: Record<string, string | string[]>;
    query?: Record<string, string | string[]>;
    tenantId?: number;
    method: string;
    url: string;
}

describe('TenantRoleGuard (unit)', () => {
    let guard: TenantRoleGuard;
    let mockRoleService: jest.Mocked<RoleService>;
    let mockReflector: jest.Mocked<Reflector>;
    let mockContext: jest.Mocked<ExecutionContext>;
    let mockRequest: TestRequest;

    beforeEach(() => {
        mockRoleService = {
            getUserRoles: jest.fn(),
        } as unknown as jest.Mocked<RoleService>;

        mockReflector = {
            getAllAndOverride: jest.fn(),
        } as unknown as jest.Mocked<Reflector>;

        mockRequest = {
            headers: {},
            query: {},
            method: 'GET',
            url: '/test-endpoint',
        };

        mockContext = {
            switchToHttp: jest.fn().mockReturnValue({
                getRequest: jest.fn().mockReturnValue(mockRequest),
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as unknown as jest.Mocked<ExecutionContext>;

        guard = new TenantRoleGuard(mockRoleService, mockReflector);
    });

    describe('Публичные endpoints (без @RequiresTenant)', () => {
        it('должен разрешить доступ если проверка тенанта не требуется', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(null);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRoleService.getUserRoles).not.toHaveBeenCalled();
        });

        it('должен разрешить доступ если requiresTenant = false', async () => {
            mockReflector.getAllAndOverride.mockReturnValue(false);

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });
    });

    describe('Пользователь не авторизован', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(true);
        });

        it('должен вернуть 403 если пользователь не найден в request', async () => {
            mockRequest.user = undefined;

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'Пользователь не авторизован',
            );
        });

        it('должен вернуть 403 если у пользователя нет id', async () => {
            mockRequest.user = {
                id: undefined,
                userId: undefined,
            } as IDecodedAccessToken;

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'ID пользователя не найден',
            );
        });
    });

    describe('Тенант не указан', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(true);
            mockRequest.user = {
                id: 1,
                userId: 1,
            } as IDecodedAccessToken;
        });

        it('должен вернуть 400 если tenantId не найден ни в одном источнике', async () => {
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                BadRequestException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'Тенант не указан',
            );
        });

        it('должен вернуть 400 если tenantId в header невалидный', async () => {
            mockRequest.headers['x-tenant-id'] = 'invalid';

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('должен вернуть 400 если tenantId в query невалидный', async () => {
            mockRequest.query = { tenant_id: 'not-a-number' };

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('Получение tenantId из разных источников', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(true);
            mockRequest.user = {
                id: 1,
                userId: 1,
            } as IDecodedAccessToken;
            mockRoleService.getUserRoles.mockResolvedValue({
                userId: 1,
                roles: [
                    {
                        id: 1,
                        roleName: 'TENANT_ADMIN',
                        roleDescription: 'Администратор',
                        roleLevel: 60,
                        tenantId: 1,
                        grantedAt: new Date().toISOString(),
                        expiresAt: undefined,
                        isActive: true,
                    },
                ],
                totalCount: 1,
            });
        });

        it('должен использовать tenantId из user.tenantId (приоритет 1)', async () => {
            mockRequest.user = {
                id: 1,
                userId: 1,
                tenantId: 1,
            } as IDecodedAccessToken;

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(1, 1);
            expect(mockRequest.tenantId).toBe(1);
        });

        it('должен использовать tenantId из header x-tenant-id (приоритет 2)', async () => {
            mockRequest.headers['x-tenant-id'] = '2';

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(1, 2);
            expect(mockRequest.tenantId).toBe(2);
        });

        it('должен использовать tenantId из query tenant_id (приоритет 3)', async () => {
            mockRequest.query = { tenant_id: '3' };

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(1, 3);
            expect(mockRequest.tenantId).toBe(3);
        });

        it('должен обработать tenantId как массив в header', async () => {
            mockRequest.headers['x-tenant-id'] = ['4'];

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(1, 4);
        });

        it('должен обработать tenantId как массив в query', async () => {
            mockRequest.query = { tenant_id: ['5'] };

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(1, 5);
        });
    });

    describe('Пользователь без ролей в тенанте', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(true);
            mockRequest.user = {
                id: 1,
                userId: 1,
                tenantId: 1,
            } as IDecodedAccessToken;
        });

        it('должен вернуть 403 если у пользователя нет ролей в тенанте', async () => {
            mockRoleService.getUserRoles.mockResolvedValue({
                userId: 1,
                roles: [],
                totalCount: 0,
            });

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'У вас нет доступа к этому тенанту',
            );
        });

        it('должен вернуть 403 если roles undefined', async () => {
            mockRoleService.getUserRoles.mockResolvedValue({
                userId: 1,
                roles: undefined as unknown as never[],
                totalCount: 0,
            });

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('Успешная проверка', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(true);
            mockRequest.user = {
                id: 1,
                userId: 1,
                tenantId: 1,
            } as IDecodedAccessToken;
        });

        it('должен разрешить доступ если пользователь имеет роль в тенанте', async () => {
            mockRoleService.getUserRoles.mockResolvedValue({
                userId: 1,
                roles: [
                    {
                        id: 1,
                        roleName: 'TENANT_ADMIN',
                        roleDescription: 'Администратор',
                        roleLevel: 60,
                        tenantId: 1,
                        grantedAt: new Date().toISOString(),
                        expiresAt: undefined,
                        isActive: true,
                    },
                ],
                totalCount: 1,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
            expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(1, 1);
            expect(mockRequest.tenantId).toBe(1);
        });

        it('должен разрешить доступ если пользователь имеет несколько ролей в тенанте', async () => {
            mockRoleService.getUserRoles.mockResolvedValue({
                userId: 1,
                roles: [
                    {
                        id: 1,
                        roleName: 'TENANT_ADMIN',
                        roleDescription: 'Администратор',
                        roleLevel: 60,
                        tenantId: 1,
                        grantedAt: new Date().toISOString(),
                        expiresAt: undefined,
                        isActive: true,
                    },
                    {
                        id: 2,
                        roleName: 'MANAGER',
                        roleDescription: 'Менеджер',
                        roleLevel: 50,
                        tenantId: 1,
                        grantedAt: new Date().toISOString(),
                        expiresAt: undefined,
                        isActive: true,
                    },
                ],
                totalCount: 2,
            });

            const result = await guard.canActivate(mockContext);

            expect(result).toBe(true);
        });
    });

    describe('Обработка ошибок', () => {
        beforeEach(() => {
            mockReflector.getAllAndOverride.mockReturnValue(true);
            mockRequest.user = {
                id: 1,
                userId: 1,
                tenantId: 1,
            } as IDecodedAccessToken;
        });

        it('должен обработать ошибку RoleService и вернуть 403', async () => {
            mockRoleService.getUserRoles.mockRejectedValue(
                new Error('Database error'),
            );

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                ForbiddenException,
            );
            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                'Ошибка проверки доступа к тенанту',
            );
        });

        it('должен пробросить BadRequestException как есть', async () => {
            mockRequest.user = {
                id: 1,
                userId: 1,
            } as IDecodedAccessToken;

            await expect(guard.canActivate(mockContext)).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});

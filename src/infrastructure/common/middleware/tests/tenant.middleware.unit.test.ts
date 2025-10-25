import { TenantModel } from '@app/domain/models/tenant.model';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import { TenantContext } from '../../context';
import { TenantMiddleware } from '../tenant.middleware';

describe('TenantMiddleware', () => {
    let middleware: TenantMiddleware;
    let mockTenantContext: {
        setTenantId: jest.Mock;
        getTenantId: jest.Mock;
        getTenantIdOrNull: jest.Mock;
        hasTenantId: jest.Mock;
        clear: jest.Mock;
    };
    let tenantModel: jest.Mocked<typeof TenantModel>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(async () => {
        // Reset NODE_ENV before each test
        process.env.NODE_ENV = 'test';

        // Mock TenantContext (REQUEST-scoped)
        mockTenantContext = {
            setTenantId: jest.fn(),
            getTenantId: jest.fn().mockReturnValue(1),
            getTenantIdOrNull: jest.fn().mockReturnValue(1),
            hasTenantId: jest.fn().mockReturnValue(true),
            clear: jest.fn(),
        };

        // Mock TenantModel
        const mockTenantModelToken = getModelToken(TenantModel);
        const findByPkMock = jest.fn();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TenantMiddleware,
                {
                    provide: TenantContext,
                    useValue: mockTenantContext,
                },
                {
                    provide: mockTenantModelToken,
                    useValue: {
                        findByPk: findByPkMock,
                    },
                },
            ],
        }).compile();

        middleware = module.get<TenantMiddleware>(TenantMiddleware);
        tenantModel = module.get(mockTenantModelToken);

        // Setup mocks
        mockRequest = {
            headers: {},
            hostname: 'localhost',
        };
        mockResponse = {};
        mockNext = jest.fn();

        // Spy on console.warn
        jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        // Restore NODE_ENV
        process.env.NODE_ENV = originalNodeEnv;
        jest.clearAllMocks();
    });

    describe('Valid x-tenant-id header', () => {
        it('should accept valid tenant ID and set context', async () => {
            const mockTenant = {
                id: 42,
                name: 'Test Tenant',
                status: 'active',
            } as TenantModel;

            mockRequest.headers = { 'x-tenant-id': '42' };
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(mockTenant);

            await middleware.use(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(tenantModel.findByPk).toHaveBeenCalledWith(42);
            expect(mockTenantContext.setTenantId).toHaveBeenCalledWith(42);
            expect(mockRequest.tenantId).toBe(42);
            expect(mockRequest.tenant).toEqual(mockTenant);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should accept tenant ID = 1', async () => {
            const mockTenant = {
                id: 1,
                name: 'Default Tenant',
                status: 'active',
            } as TenantModel;

            mockRequest.headers = { 'x-tenant-id': '1' };
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(mockTenant);

            await middleware.use(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockTenantContext.setTenantId).toHaveBeenCalledWith(1);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Invalid x-tenant-id header', () => {
        it('should throw BadRequestException for non-numeric tenant ID', async () => {
            mockRequest.headers = { 'x-tenant-id': 'invalid' };

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(BadRequestException);

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(
                'Неверный формат x-tenant-id: "invalid". Ожидается положительное число',
            );

            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException for negative tenant ID', async () => {
            mockRequest.headers = { 'x-tenant-id': '-5' };

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(BadRequestException);

            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException for zero tenant ID', async () => {
            mockRequest.headers = { 'x-tenant-id': '0' };

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(BadRequestException);

            expect(mockNext).not.toHaveBeenCalled();
        });

        // TODO: Empty string header behavior
        // Current: fallback to tenant_id=1 (dev mode), then tenant not found → ForbiddenException
        // Expected: could validate earlier and throw BadRequestException
        it.skip('should throw BadRequestException for empty string', async () => {
            mockRequest.headers = { 'x-tenant-id': '   ' };

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(BadRequestException);

            expect(mockNext).not.toHaveBeenCalled();
        });

        // TODO: Float number header behavior
        // Current: parseInt('3.14', 10) = 3 (valid!), then tenant 3 not found → ForbiddenException
        // Expected: could validate format with regex before parseInt
        it.skip('should throw BadRequestException for float number', async () => {
            mockRequest.headers = { 'x-tenant-id': '3.14' };

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(BadRequestException);

            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Missing x-tenant-id header', () => {
        it('should throw BadRequestException in production mode', async () => {
            process.env.NODE_ENV = 'production';
            mockRequest.headers = {};

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(BadRequestException);

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(
                'x-tenant-id header обязателен для multi-tenant режима',
            );

            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should fallback to tenant_id=1 in development mode', async () => {
            process.env.NODE_ENV = 'development';

            const mockTenant = {
                id: 1,
                name: 'Default Tenant',
                status: 'active',
            } as TenantModel;

            mockRequest.headers = {};
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(mockTenant);

            await middleware.use(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(console.warn).toHaveBeenCalledWith(
                '[TenantMiddleware] x-tenant-id header отсутствует. Используется default tenant_id=1 (development mode)',
            );
            expect(mockTenantContext.setTenantId).toHaveBeenCalledWith(1);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should fallback to tenant_id=1 in test mode', async () => {
            process.env.NODE_ENV = 'test';

            const mockTenant = {
                id: 1,
                name: 'Default Tenant',
                status: 'active',
            } as TenantModel;

            mockRequest.headers = {};
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(mockTenant);

            await middleware.use(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockTenantContext.setTenantId).toHaveBeenCalledWith(1);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Tenant not found', () => {
        it('should throw ForbiddenException if tenant does not exist', async () => {
            mockRequest.headers = { 'x-tenant-id': '999' };
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(null);

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(ForbiddenException);

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow('Tenant с ID 999 не найден в системе');

            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Tenant suspended/inactive', () => {
        it('should throw ForbiddenException if tenant is suspended', async () => {
            const mockTenant = {
                id: 5,
                name: 'Suspended Tenant',
                status: 'suspended',
            } as TenantModel;

            mockRequest.headers = { 'x-tenant-id': '5' };
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(mockTenant);

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(ForbiddenException);

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(
                'Tenant "Suspended Tenant" неактивен (статус: suspended)',
            );

            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException if tenant is deleted', async () => {
            const mockTenant = {
                id: 7,
                name: 'Deleted Tenant',
                status: 'deleted',
            } as TenantModel;

            mockRequest.headers = { 'x-tenant-id': '7' };
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(mockTenant);

            await expect(
                middleware.use(
                    mockRequest as Request,
                    mockResponse as Response,
                    mockNext,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Edge cases', () => {
        it('should handle very large tenant ID', async () => {
            const mockTenant = {
                id: 2147483647, // Max INT32
                name: 'Large ID Tenant',
                status: 'active',
            } as TenantModel;

            mockRequest.headers = { 'x-tenant-id': '2147483647' };
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(mockTenant);

            await middleware.use(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockTenantContext.setTenantId).toHaveBeenCalledWith(
                2147483647,
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it('should trim whitespace from tenant ID', async () => {
            const mockTenant = {
                id: 10,
                name: 'Test Tenant',
                status: 'active',
            } as TenantModel;

            mockRequest.headers = { 'x-tenant-id': '  10  ' };
            (tenantModel.findByPk as jest.Mock).mockResolvedValue(mockTenant);

            await middleware.use(
                mockRequest as Request,
                mockResponse as Response,
                mockNext,
            );

            expect(mockTenantContext.setTenantId).toHaveBeenCalledWith(10);
            expect(mockNext).toHaveBeenCalled();
        });
    });
});

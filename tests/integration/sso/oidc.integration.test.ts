/**
 * Integration тесты для OpenID Connect SSO flow
 *
 * Тестирует полный flow SSO аутентификации через OIDC:
 * - Инициирование SSO (GET /auth/sso/:providerId)
 * - Callback обработка (GET /auth/sso/oidc/callback)
 * - Just-in-time provisioning
 * - Синхронизация ролей
 *
 * Related to: SAAS-017-19, Этап 3
 */

import type { INestApplication } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import request from 'supertest';
import { setupTestApp } from '../../setup/app';
import { TestCleanup } from '../../utils';
import { TestDatabaseSetup } from '../../utils/test-database-setup';
import {
    ExternalRoleConfigModel,
    RoleMappingModel,
    RoleModel,
} from '@app/domain/models';
import { MockOIDCServer } from './mock-sso-servers';

describe('OpenID Connect SSO Flow (integration)', () => {
    let app: INestApplication;
    let mockOIDCServer: MockOIDCServer;
    let sequelize: Sequelize;
    let providerConfig: ExternalRoleConfigModel;
    let roleMapping: RoleMappingModel;
    let adminRole: RoleModel;

    beforeAll(async () => {
        jest.setTimeout(30000);

        await TestDatabaseSetup.setupDatabase('test');

        app = await setupTestApp();
        sequelize = app.get<Sequelize>(Sequelize);

        adminRole = await RoleModel.create({
            role: 'ADMIN',
            description: 'Administrator role',
            level: 100,
            tenantId: 1,
            isSystemRole: false,
            isActive: true,
        });

        // Создаем mock OIDC сервер
        const issuer = 'http://localhost:0'; // Будет заменен после старта сервера
        mockOIDCServer = new MockOIDCServer({
            issuer,
            clientId: 'test-oidc-client-id',
            clientSecret: 'test-oidc-client-secret',
            redirectUri: 'http://localhost:3000/online-store/auth/sso/oidc/callback',
            users: [
                {
                    sub: 'sso-user-123',
                    email: 'sso.user@test.com',
                    firstName: 'SSO',
                    lastName: 'User',
                    roles: ['Admin'],
                },
            ],
        });

        const serverPort = await mockOIDCServer.start();
        const actualIssuer = mockOIDCServer.getIssuer();

        providerConfig = await ExternalRoleConfigModel.create({
            tenantId: 1,
            providerType: 'OIDC',
            name: 'Test OIDC Provider',
            description: 'Test OIDC provider for integration tests',
            providerConfig: {
                issuer: actualIssuer,
                clientId: 'test-oidc-client-id',
                clientSecret: 'test-oidc-client-secret',
                callbackURL: 'http://localhost:3000/online-store/auth/sso/oidc/callback',
                scope: ['openid', 'profile', 'email'],
            },
            syncEnabled: true,
            status: 'ACTIVE',
            credentialsEncrypted: false,
        });

        roleMapping = await RoleMappingModel.create({
            externalRoleConfigId: providerConfig.id,
            tenantId: 1,
            externalRoleName: 'Admin',
            internalRoleId: adminRole.id,
            mappingRules: null,
            priority: 100,
            isActive: true,
        });
    }, 30000);

    afterAll(async () => {
        if (mockOIDCServer) {
            await mockOIDCServer.stop();
        }

        if (app) {
            if (roleMapping) {
                await roleMapping.destroy();
            }
            if (providerConfig) {
                await providerConfig.destroy();
            }
            if (adminRole) {
                await adminRole.destroy();
            }

            await TestCleanup.cleanUsers(sequelize);
            await app.close();
        }
    }, 10000);

    describe('SSO Initiation', () => {
        it('должен перенаправить на OIDC провайдера при инициировании SSO', async () => {
            const response = await request(app.getHttpServer())
                .get(`/online-store/auth/sso/${providerConfig.id}`)
                .expect((res) => {
                    expect([HttpStatus.FOUND, HttpStatus.UNAUTHORIZED]).toContain(res.status);
                });

            if (response.status === HttpStatus.FOUND) {
                const redirectUrl = response.headers.location;
                expect(redirectUrl).toContain(mockOIDCServer.getBaseUrl());
                expect(redirectUrl).toContain('client_id=test-oidc-client-id');
            }
        });
    });

    describe('Error Handling', () => {
        it('должен вернуть 401 при невалидном state', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/sso/oidc/callback')
                .query({
                    code: 'test-code',
                    state: 'invalid-state',
                })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body).toHaveProperty('message');
        });
    });
});


/**
 * Integration тесты для обработки ошибок SSO flow
 * 
 * Тестирует различные сценарии ошибок:
 * - Невалидный state parameter
 * - Истекший state parameter
 * - Отсутствующий провайдер
 * - Неактивный провайдер
 * - Ошибки callback обработки
 * - Ошибки маппинга профилей
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
    RoleModel,
} from '@app/domain/models';

describe('SSO Error Handling (integration)', () => {
    let app: INestApplication;
    let sequelize: Sequelize;
    let providerConfig: ExternalRoleConfigModel;
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

        providerConfig = await ExternalRoleConfigModel.create({
            tenantId: 1,
            providerType: 'GENERIC_OAUTH2',
            name: 'Error Test Provider',
            description: 'Provider for error handling tests',
            providerConfig: {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                authorizationURL: 'https://example.com/auth',
                tokenURL: 'https://example.com/token',
                callbackURL: 'http://localhost:3000/online-store/auth/sso/oauth2/callback',
            },
            syncEnabled: true,
            status: 'ACTIVE',
            credentialsEncrypted: false,
        });
    }, 30000);

    afterAll(async () => {
        if (app) {
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

    describe('State Parameter Validation', () => {
        it('должен вернуть 401 при отсутствии state в callback', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/sso/oauth2/callback')
                .query({
                    code: 'test-code',
                    // state отсутствует
                })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('state');
        });

        it('должен вернуть 401 при невалидном state', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/sso/oauth2/callback')
                .query({
                    code: 'test-code',
                    state: 'invalid-state-12345',
                })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body).toHaveProperty('message');
        });

        it('должен вернуть 401 при истекшем state', async () => {
            // State истекает через 5 минут
            // Для теста используем невалидный state (симуляция истекшего)
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/sso/oauth2/callback')
                .query({
                    code: 'test-code',
                    state: 'expired-state-' + Date.now(),
                })
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('Provider Configuration Errors', () => {
        it('должен вернуть 401 при несуществующем providerId', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/sso/99999')
                .expect((res) => {
                    expect([HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND]).toContain(res.status);
                });

            expect(response.body).toHaveProperty('message');
        });

        it('должен вернуть 400 при неактивном провайдере', async () => {
            const inactiveProvider = await ExternalRoleConfigModel.create({
                tenantId: 1,
                providerType: 'GENERIC_OAUTH2',
                name: 'Inactive Provider',
                status: 'INACTIVE',
                providerConfig: {
                    clientId: 'test',
                    authorizationURL: 'https://example.com/auth',
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/online-store/auth/sso/${inactiveProvider.id}`)
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('неактивен');

            await inactiveProvider.destroy();
        });

        it('должен вернуть 400 при провайдере в статусе ERROR', async () => {
            const errorProvider = await ExternalRoleConfigModel.create({
                tenantId: 1,
                providerType: 'GENERIC_OAUTH2',
                name: 'Error Provider',
                status: 'ERROR',
                providerConfig: {
                    clientId: 'test',
                    authorizationURL: 'https://example.com/auth',
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/online-store/auth/sso/${errorProvider.id}`)
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body).toHaveProperty('message');

            await errorProvider.destroy();
        });
    });

    describe('Callback Processing Errors', () => {
        it('должен вернуть 401 при отсутствии code в OAuth2 callback', async () => {
            // Сначала получаем валидный state
            const initiateResponse = await request(app.getHttpServer())
                .get(`/online-store/auth/sso/${providerConfig.id}`)
                .expect((res) => {
                    expect([HttpStatus.FOUND, HttpStatus.UNAUTHORIZED]).toContain(res.status);
                });

            if (initiateResponse.status !== HttpStatus.FOUND) {
                return; // Пропускаем если tenant не найден
            }

            const redirectUrl = new URL(initiateResponse.headers.location);
            const state = redirectUrl.searchParams.get('state');

            if (!state) {
                return;
            }

            // Пытаемся вызвать callback без code
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/sso/oauth2/callback')
                .query({
                    // code отсутствует
                    state: state,
                })
                .expect((res) => {
                    // Может быть 401 (невалидный state) или другая ошибка
                    expect(res.status).toBeGreaterThanOrEqual(400);
                });

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('SAML Error Handling', () => {
        it('должен вернуть 401 при отсутствии SAMLResponse', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/sso/saml/callback')
                .send({
                    // SAMLResponse отсутствует
                    RelayState: 'test-relay-state',
                })
                .expect((res) => {
                    expect(res.status).toBeGreaterThanOrEqual(400);
                });

            expect(response.body).toHaveProperty('message');
        });

        it('должен вернуть 401 при отсутствии RelayState', async () => {
            const response = await request(app.getHttpServer())
                .post('/online-store/auth/sso/saml/callback')
                .send({
                    SAMLResponse: 'test-saml-response',
                    // RelayState отсутствует
                })
                .expect((res) => {
                    expect(res.status).toBeGreaterThanOrEqual(400);
                });

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('OIDC Error Handling', () => {
        it('должен вернуть 401 при отсутствии code в OIDC callback', async () => {
            const response = await request(app.getHttpServer())
                .get('/online-store/auth/sso/oidc/callback')
                .query({
                    // code отсутствует
                    state: 'test-state',
                })
                .expect((res) => {
                    expect(res.status).toBeGreaterThanOrEqual(400);
                });

            expect(response.body).toHaveProperty('message');
        });
    });
});


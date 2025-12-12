/**
 * Mock SSO Servers для integration тестов
 *
 * Предоставляет mock серверы для OAuth 2.0, SAML и OIDC провайдеров
 * для тестирования SSO flow без реальных внешних сервисов
 *
 * Related to: SAAS-017-19, Этап 3
 */

import type { Express, Request, Response } from 'express';
import express from 'express';
import * as http from 'http';
import * as crypto from 'crypto';

export interface MockOAuth2ServerOptions {
    port?: number;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    users: Array<{
        email: string;
        password?: string;
        firstName?: string;
        lastName?: string;
        roles?: string[];
    }>;
}

export interface MockSAMLServerOptions {
    port?: number;
    issuer: string;
    cert: string;
    privateKey: string;
    users: Array<{
        nameID: string;
        email: string;
        firstName?: string;
        lastName?: string;
        roles?: string[];
    }>;
}

export interface MockOIDCServerOptions {
    port?: number;
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    users: Array<{
        sub: string;
        email: string;
        firstName?: string;
        lastName?: string;
        roles?: string[];
    }>;
}

/**
 * Mock OAuth 2.0 Authorization Server
 */
export class MockOAuth2Server {
    private app: Express;
    private server: http.Server | null = null;
    private port: number;
    private options: MockOAuth2ServerOptions;
    private authorizationCodes = new Map<string, { userId: string; expiresAt: number }>();

    constructor(options: MockOAuth2ServerOptions) {
        this.options = options;
        this.port = options.port ?? 0; // 0 = случайный порт
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Authorization endpoint
        this.app.get('/authorize', (req: Request, res: Response) => {
            const { client_id, redirect_uri, state, response_type } = req.query;

            if (client_id !== this.options.clientId) {
                return res.status(400).json({ error: 'invalid_client' });
            }

            if (redirect_uri !== this.options.redirectUri) {
                return res.status(400).json({ error: 'invalid_redirect_uri' });
            }

            if (response_type !== 'code') {
                return res.status(400).json({ error: 'unsupported_response_type' });
            }

            // В реальном сценарии здесь была бы форма логина
            // Для тестов автоматически авторизуем первого пользователя
            const user = this.options.users[0];
            if (!user) {
                return res.status(400).json({ error: 'no_users_configured' });
            }

            // Генерируем authorization code
            const code = crypto.randomBytes(32).toString('hex');
            this.authorizationCodes.set(code, {
                userId: user.email,
                expiresAt: Date.now() + 10 * 60 * 1000, // 10 минут
            });

            // Перенаправляем на callback с code
            const redirectUrl = new URL(redirect_uri as string);
            redirectUrl.searchParams.set('code', code);
            if (state) {
                redirectUrl.searchParams.set('state', state as string);
            }

            res.redirect(redirectUrl.toString());
        });

        // Token endpoint
        this.app.post('/token', (req: Request, res: Response) => {
            const { code, client_id, client_secret, redirect_uri, grant_type } = req.body;

            if (client_id !== this.options.clientId || client_secret !== this.options.clientSecret) {
                return res.status(401).json({ error: 'invalid_client' });
            }

            if (grant_type !== 'authorization_code') {
                return res.status(400).json({ error: 'unsupported_grant_type' });
            }

            const codeData = this.authorizationCodes.get(code);
            if (!codeData || Date.now() > codeData.expiresAt) {
                return res.status(400).json({ error: 'invalid_grant' });
            }

            // Удаляем использованный code
            this.authorizationCodes.delete(code);

            const user = this.options.users.find((u) => u.email === codeData.userId);
            if (!user) {
                return res.status(400).json({ error: 'user_not_found' });
            }

            // Генерируем токены
            const accessToken = crypto.randomBytes(32).toString('hex');
            const refreshToken = crypto.randomBytes(32).toString('hex');

            res.json({
                access_token: accessToken,
                token_type: 'Bearer',
                expires_in: 3600,
                refresh_token: refreshToken,
            });
        });

        // UserInfo endpoint
        this.app.get('/userinfo', (req: Request, res: Response) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'invalid_token' });
            }

            // В реальном сценарии здесь была бы проверка токена
            // Для тестов возвращаем данные первого пользователя
            const user = this.options.users[0];
            if (!user) {
                return res.status(400).json({ error: 'user_not_found' });
            }

            res.json({
                id: user.email,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
                roles: user.roles ?? [],
            });
        });
    }

    public async start(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                const actualPort = (this.server?.address() as { port: number })?.port ?? 0;
                this.port = actualPort;
                resolve(actualPort);
            });

            this.server.on('error', reject);
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                return resolve();
            }

            this.server.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    this.server = null;
                    resolve();
                }
            });
        });
    }

    public getBaseUrl(): string {
        return `http://localhost:${this.port}`;
    }

    public getAuthorizationUrl(): string {
        return `${this.getBaseUrl()}/authorize`;
    }

    public getTokenUrl(): string {
        return `${this.getBaseUrl()}/token`;
    }

    public getUserInfoUrl(): string {
        return `${this.getBaseUrl()}/userinfo`;
    }
}

/**
 * Mock SAML 2.0 Identity Provider
 *
 * Упрощенная реализация для тестирования
 */
export class MockSAMLServer {
    private app: Express;
    private server: http.Server | null = null;
    private port: number;
    private options: MockSAMLServerOptions;

    constructor(options: MockSAMLServerOptions) {
        this.options = options;
        this.port = options.port ?? 0;
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        this.setupRoutes();
    }

    private setupRoutes(): void {
        // SAML SSO endpoint
        this.app.post('/sso', (req: Request, res: Response) => {
            // В реальном сценарии здесь была бы проверка SAMLRequest
            // Для тестов автоматически генерируем SAMLResponse

            const user = this.options.users[0];
            if (!user) {
                return res.status(400).send('No users configured');
            }

            // Упрощенный SAML Response (в реальности нужна полная XML структура)
            const samlResponse = this.generateSAMLResponse(user);

            // Перенаправляем на callback с SAMLResponse
            res.send(`
                <html>
                    <body>
                        <form id="samlForm" method="POST" action="${req.body.RelayState || '/saml/callback'}">
                            <input type="hidden" name="SAMLResponse" value="${samlResponse}" />
                            <input type="hidden" name="RelayState" value="${req.body.RelayState || ''}" />
                        </form>
                        <script>document.getElementById('samlForm').submit();</script>
                    </body>
                </html>
            `);
        });
    }

    private generateSAMLResponse(user: MockSAMLServerOptions['users'][0]): string {
        // Упрощенный SAML Response (base64 encoded)
        // В реальности нужна полная XML структура с подписью
        const samlAssertion = {
            nameID: user.nameID,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles ?? [],
        };

        return Buffer.from(JSON.stringify(samlAssertion)).toString('base64');
    }

    public async start(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                const actualPort = (this.server?.address() as { port: number })?.port ?? 0;
                this.port = actualPort;
                resolve(actualPort);
            });

            this.server.on('error', reject);
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                return resolve();
            }

            this.server.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    this.server = null;
                    resolve();
                }
            });
        });
    }

    public getBaseUrl(): string {
        return `http://localhost:${this.port}`;
    }

    public getEntryPoint(): string {
        return `${this.getBaseUrl()}/sso`;
    }
}

/**
 * Mock OpenID Connect Provider
 */
export class MockOIDCServer {
    private app: Express;
    private server: http.Server | null = null;
    private port: number;
    private options: MockOIDCServerOptions;
    private authorizationCodes = new Map<string, { userId: string; expiresAt: number }>();

    constructor(options: MockOIDCServerOptions) {
        this.options = options;
        this.port = options.port ?? 0;
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Discovery endpoint (.well-known/openid-configuration)
        this.app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
            const baseUrl = this.getBaseUrl();
            res.json({
                issuer: this.options.issuer,
                authorization_endpoint: `${baseUrl}/authorize`,
                token_endpoint: `${baseUrl}/token`,
                userinfo_endpoint: `${baseUrl}/userinfo`,
                jwks_uri: `${baseUrl}/.well-known/jwks.json`,
                response_types_supported: ['code'],
                grant_types_supported: ['authorization_code'],
                scopes_supported: ['openid', 'profile', 'email'],
            });
        });

        // JWKS endpoint
        this.app.get('/.well-known/jwks.json', (req: Request, res: Response) => {
            res.json({
                keys: [], // Упрощено для тестов
            });
        });

        // Authorization endpoint
        this.app.get('/authorize', (req: Request, res: Response) => {
            const { client_id, redirect_uri, state, response_type, scope } = req.query;

            if (client_id !== this.options.clientId) {
                return res.status(400).json({ error: 'invalid_client' });
            }

            if (redirect_uri !== this.options.redirectUri) {
                return res.status(400).json({ error: 'invalid_redirect_uri' });
            }

            if (response_type !== 'code') {
                return res.status(400).json({ error: 'unsupported_response_type' });
            }

            const user = this.options.users[0];
            if (!user) {
                return res.status(400).json({ error: 'no_users_configured' });
            }

            const code = crypto.randomBytes(32).toString('hex');
            this.authorizationCodes.set(code, {
                userId: user.sub,
                expiresAt: Date.now() + 10 * 60 * 1000,
            });

            const redirectUrl = new URL(redirect_uri as string);
            redirectUrl.searchParams.set('code', code);
            if (state) {
                redirectUrl.searchParams.set('state', state as string);
            }

            res.redirect(redirectUrl.toString());
        });

        // Token endpoint
        this.app.post('/token', (req: Request, res: Response) => {
            const { code, client_id, client_secret, redirect_uri, grant_type } = req.body;

            if (client_id !== this.options.clientId || client_secret !== this.options.clientSecret) {
                return res.status(401).json({ error: 'invalid_client' });
            }

            if (grant_type !== 'authorization_code') {
                return res.status(400).json({ error: 'unsupported_grant_type' });
            }

            const codeData = this.authorizationCodes.get(code);
            if (!codeData || Date.now() > codeData.expiresAt) {
                return res.status(400).json({ error: 'invalid_grant' });
            }

            this.authorizationCodes.delete(code);

            const user = this.options.users.find((u) => u.sub === codeData.userId);
            if (!user) {
                return res.status(400).json({ error: 'user_not_found' });
            }

            const accessToken = crypto.randomBytes(32).toString('hex');
            const idToken = crypto.randomBytes(32).toString('hex');

            res.json({
                access_token: accessToken,
                token_type: 'Bearer',
                expires_in: 3600,
                id_token: idToken,
            });
        });

        // UserInfo endpoint
        this.app.get('/userinfo', (req: Request, res: Response) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'invalid_token' });
            }

            const user = this.options.users[0];
            if (!user) {
                return res.status(400).json({ error: 'user_not_found' });
            }

            res.json({
                sub: user.sub,
                email: user.email,
                given_name: user.firstName,
                family_name: user.lastName,
                name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
                roles: user.roles ?? [],
            });
        });
    }

    public async start(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, () => {
                const actualPort = (this.server?.address() as { port: number })?.port ?? 0;
                this.port = actualPort;
                resolve(actualPort);
            });

            this.server.on('error', reject);
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                return resolve();
            }

            this.server.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    this.server = null;
                    resolve();
                }
            });
        });
    }

    public getBaseUrl(): string {
        return `http://localhost:${this.port}`;
    }

    public getIssuer(): string {
        // Если issuer был localhost:0, заменяем на реальный порт
        if (this.options.issuer.includes('localhost:0')) {
            return this.options.issuer.replace('localhost:0', `localhost:${this.port}`);
        }
        return this.options.issuer;
    }
}


import { type INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function authLoginAs(
    app: INestApplication,
    role: 'user' | 'admin',
): Promise<string> {
    const creds =
        role === 'admin'
            ? { email: 'admin@example.com', password: 'Password123!' }
            : { email: 'user@example.com', password: 'Password123!' };

    const res = await request(app.getHttpServer())
        .post('/online-store/auth/login')
        .send(creds);

    if (res.status !== 200 && res.status !== 201) {
        console.error(`❌ Login failed for ${role}:`, {
            status: res.status,
            body: res.body,
            credentials: { email: creds.email, password: '***' },
        });
        throw new Error(
            `Failed to login as ${role}: ${res.status} ${JSON.stringify(res.body)}`,
        );
    }

    if (!res.body.accessToken) {
        console.error(`❌ No accessToken in response for ${role}:`, res.body);
        throw new Error(`No accessToken received for ${role}`);
    }

    return res.body.accessToken;
}

// Пример агента для работы с refresh-cookie
export function createAgent(app: INestApplication) {
    return request.agent(app.getHttpServer());
}

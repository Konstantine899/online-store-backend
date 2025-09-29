import { INestApplication } from '@nestjs/common';
import request from 'supertest';


export async function authLoginAs(app: INestApplication, role: 'user' | 'admin'): Promise<string> {
    const creds = role === 'admin'
        ? { email: 'admin@example.com', password: 'password' }
        : { email: 'user@example.com', password: 'password' };

    const res = await request(app.getHttpServer()).post('/auth/login').send(creds);
    return res.body.accessToken;
}

// Пример агента для работы с refresh-cookie
export function createAgent(app: INestApplication) {
    return request.agent(app.getHttpServer());
}
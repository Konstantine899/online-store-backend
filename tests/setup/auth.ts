import { INestApplication } from '@nestjs/common';
import request from 'supertest';


export async function authLoginAs(app: INestApplication, role: 'user' | 'admin'): Promise<string> {
    const creds = role === 'admin'
        ? { email: 'admin@example.com', password: 'Password123!' }
        : { email: 'user@example.com', password: 'Password123!' };

    const res = await request(app.getHttpServer()).post('/online-store/auth/login').send(creds);
    console.log('Login response status:', res.status);
    console.log('Login response body:', res.body);
    return res.body.accessToken;
}

// Пример агента для работы с refresh-cookie
export function createAgent(app: INestApplication) {
    return request.agent(app.getHttpServer());
}
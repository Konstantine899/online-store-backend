import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { setupTestApp } from '../../../../tests/setup/app';
import { authLoginAs } from '../../../../tests/setup/auth';

describe('UserAddressController (integration)', () => {
    let app: INestApplication;
    let accessToken: string;

    beforeAll(async () => {
        app = await setupTestApp();
        accessToken = await authLoginAs(app, 'user');
        console.log('Access token:', accessToken);
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /user/addresses -> 201 create address', async () => {
        await request(app.getHttpServer())
            .post('/user/addresses')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Дом',
                street: 'ул. Пушкина',
                house: '10',
                city: 'Москва',
                is_default: true,
            })
            .expect(201)
            .expect(({ body }) => {
                expect(body?.data?.id).toBeDefined();
                expect(body?.data?.is_default).toBe(true);
            });
    });

    it('GET /user/addresses -> 200 list', async () => {
        await request(app.getHttpServer())
            .get('/user/addresses')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)
            .expect(({ body }) => {
                expect(Array.isArray(body?.data)).toBe(true);
                expect(body?.data?.length).toBeGreaterThan(0);
            });
    });

    it('PUT /user/addresses/:id -> 200 update', async () => {
        const created = await request(app.getHttpServer())
            .post('/user/addresses')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Работа',
                street: 'Тверская',
                house: '1',
                city: 'Москва',
            });
        const id = created.body?.data?.id;

        await request(app.getHttpServer())
            .put(`/user/addresses/${id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ street: 'Новая' })
            .expect(200)
            .expect(({ body }) => {
                expect(body?.data?.street).toBe('Новая');
            });
    });

    it('PATCH /user/addresses/:id/set-default -> 200 set default', async () => {
        const created = await request(app.getHttpServer())
            .post('/user/addresses')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Дача',
                street: 'Сосновая',
                house: '7',
                city: 'Зеленоград',
            });
        const id = created.body?.data?.id;

        await request(app.getHttpServer())
            .patch(`/user/addresses/${id}/set-default`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)
            .expect(({ body }) => {
                expect(body?.data?.is_default).toBe(true);
            });
    });

    it('DELETE /user/addresses/:id -> 200 remove', async () => {
        const created = await request(app.getHttpServer())
            .post('/user/addresses')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Временный',
                street: 'Пробная',
                house: '9',
                city: 'Москва',
            });
        const id = created.body?.data?.id;

        await request(app.getHttpServer())
            .delete(`/user/addresses/${id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)
            .expect(({ body }) => {
                expect(body?.message).toBe('Адрес успешно удалён');
            });
    });

    it('401 when no token', async () => {
        await request(app.getHttpServer())
            .get('/user/addresses')
            .expect(401);
    });

    it('Debug: check token content', async () => {
        const response = await request(app.getHttpServer())
            .get('/user/addresses')
            .set('Authorization', `Bearer ${accessToken}`);
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
    });

    it('400 validation error on create', async () => {
        await request(app.getHttpServer())
            .post('/user/addresses')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ title: '', street: '', house: '', city: '' })
            .expect(400);
    });
});
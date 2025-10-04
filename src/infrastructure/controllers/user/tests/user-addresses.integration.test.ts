import request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { setupTestApp } from '../../../../tests/setup/app';
import { authLoginAs } from '../../../../tests/setup/auth';

describe('User Addresses Integration Tests', () => {
    let app: INestApplication;
    let userToken: string;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        // Минимальные переменные для тестового запуска (подхватываются Joi)
        process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
        process.env.COOKIE_PARSER_SECRET_KEY = 'test-secret-12345';
        process.env.JWT_PRIVATE_KEY = 'a'.repeat(64);
        process.env.JWT_ACCESS_SECRET = 'access-secret-123456';
        process.env.JWT_REFRESH_SECRET = 'refresh-secret-123456';
        process.env.JWT_ACCESS_EXPIRES = '15m';
        process.env.JWT_REFRESH_EXPIRES = '30d';

        app = await setupTestApp();
        await app.init();
        
        // Получаем токены для тестирования
        userToken = await authLoginAs(app, 'user');
    });

    afterAll(async () => {
        await app.close();
    });

    // ===== USER ADDRESSES ENDPOINTS =====
    describe('User Addresses CRUD', () => {
        it('401: requires auth for all address endpoints', async () => {
            await request(app.getHttpServer())
                .get('/user/addresses')
                .expect(HttpStatus.UNAUTHORIZED);

            await request(app.getHttpServer())
                .post('/user/addresses')
                .send({ title: 'X', street: 'Y', house: '1', city: 'Z', country: 'RU' })
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it('200: full CRUD flow with auth', async () => {
            const http = request(app.getHttpServer());

            // Create
            const createRes = await http
                .post('/user/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    title: 'Дом',
                    street: 'ул. Пушкина',
                    house: '10',
                    apartment: '12',
                    city: 'Москва',
                    country: 'Россия',
                    is_default: true,
                })
                .expect(HttpStatus.CREATED);

            const created = createRes.body.data || createRes.body;
            expect(created).toHaveProperty('id');
            const id = created.id;

            // Get list
            const listRes = await http.get('/user/addresses').set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.OK);
            const list = listRes.body.data || listRes.body;
            expect(Array.isArray(list)).toBe(true);

            // Get one
            const oneRes = await http.get(`/user/addresses/${id}`).set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.OK);
            const one = oneRes.body.data || oneRes.body;
            expect(one.id).toBe(id);

            // Update
            const updateRes = await http
                .put(`/user/addresses/${id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'Квартира', is_default: true })
                .expect(HttpStatus.OK);
            const updated = updateRes.body.data || updateRes.body;
            expect(updated.title).toBe('Квартира');
            expect(updated.is_default).toBe(true);

            // Set default again
            const setDefaultRes = await http
                .patch(`/user/addresses/${id}/set-default`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(HttpStatus.OK);
            const setDefault = setDefaultRes.body.data || setDefaultRes.body;
            expect(setDefault.id).toBe(id);
            expect(setDefault.is_default).toBe(true);

            // Remove
            await http.delete(`/user/addresses/${id}`).set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.OK);
        });

        it('400: validation errors on create', async () => {
            const http = request(app.getHttpServer());

            await http
                .post('/user/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})
                .expect(HttpStatus.BAD_REQUEST);

            await http
                .post('/user/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: '', street: '', house: '', city: '', country: '' })
                .expect(HttpStatus.BAD_REQUEST);
        });

        it('404: non-existent address operations', async () => {
            const http = request(app.getHttpServer());
            const nonexistentId = 999999;

            await http.get(`/user/addresses/${nonexistentId}`).set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.NOT_FOUND);
            await http
                .put(`/user/addresses/${nonexistentId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'X' })
                .expect(HttpStatus.NOT_FOUND);
            await http.delete(`/user/addresses/${nonexistentId}`).set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.NOT_FOUND);
        });

        it('400: invalid id parameter', async () => {
            const http = request(app.getHttpServer());
            await http.get('/user/addresses/not-a-number').set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.BAD_REQUEST);
            await http.put('/user/addresses/not-a-number').set('Authorization', `Bearer ${userToken}`).send({ title: 'X' }).expect(HttpStatus.BAD_REQUEST);
            await http.delete('/user/addresses/not-a-number').set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.BAD_REQUEST);
        });

        it('200: setting new default unsets previous default', async () => {
            const http = request(app.getHttpServer());

            // Create first default
            const a1 = await http
                .post('/user/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'A1', street: 'S', house: '1', city: 'C', country: 'RU', is_default: true })
                .expect(HttpStatus.CREATED);
            const id1 = (a1.body.data || a1.body).id;

            // Create second default -> should unset first
            const a2 = await http
                .post('/user/addresses')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ title: 'A2', street: 'S', house: '2', city: 'C', country: 'RU', is_default: true })
                .expect(HttpStatus.CREATED);
            const id2 = (a2.body.data || a2.body).id;

            // List should return default first
            const listRes = await http.get('/user/addresses').set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.OK);
            const list = listRes.body.data || listRes.body;
            expect(list[0].id).toBe(id2);
            expect(list.find((x: any) => x.id === id2).is_default).toBe(true);
            expect(list.find((x: any) => x.id === id1).is_default).toBe(false);

            // Cleanup
            await http.delete(`/user/addresses/${id1}`).set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.OK);
            await http.delete(`/user/addresses/${id2}`).set('Authorization', `Bearer ${userToken}`).expect(HttpStatus.OK);
        });
    });
});

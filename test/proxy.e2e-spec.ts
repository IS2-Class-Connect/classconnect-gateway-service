import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ProxyModule } from '../src/proxy/proxy.module';
import { startMockUserService } from './mock-user.service';
import { startMockEducationService } from './mock-education.service';

const mockFirebaseAdmin = {
    auth: () => ({
        verifyIdToken: jest.fn((token) => {
            if (token === 'invalid-token') {
                throw Object.assign(new Error('Invalid token'), { code: 'auth/argument-error' });
            }
            return {
                uid: 'test-uid',
                email: 'test@example.com',
                name: 'Test User',
                picture: 'https://example.com/pic.png',
            };
        }),
    }),
};

describe('ProxyController (e2e)', () => {
    let app: INestApplication;
    let userServer, educationServer;

    beforeAll(async () => {
        userServer = startMockUserService(3001);
        educationServer = startMockEducationService(3002);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ProxyModule],
        })
            .overrideProvider('FIREBASE_ADMIN')
            .useValue(mockFirebaseAdmin)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
        userServer.close();
        educationServer.close();
    });

    it('GET /users/ping should proxy to users service', async () => {
        const res = await request(app.getHttpServer())
            .get('/users/ping')
            .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Pong from users service' });
    });

    it('GET /education/ping should proxy to education service', async () => {
        const res = await request(app.getHttpServer())
            .get('/education/ping')
            .set('Authorization', 'Bearer mock-token');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Pong from education service' });
    });

    it('GET /unknown/path should return 400', async () => {
        const res = await request(app.getHttpServer())
            .get('/unknown/ping')
            .set('Authorization', 'Bearer mock-token')

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Unknown service/);
    });

    it('should return 401 for an invalid Firebase token', async () => {
        const res = await request(app.getHttpServer())
            .get('/users/ping')
            .set('Authorization', 'Bearer invalid-token');

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Invalid token/);
    });

    it('should return 401 if Authorization header is missing', async () => {
        const res = await request(app.getHttpServer()).get('/users/ping');

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Missing or invalid token/);
    });

    it('registering a user should not need authentication', async () => {
        const res = await request(app.getHttpServer()).post('/users');

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch('Created user');
    })

    it('checking lock status of a user should not need authentication', async () => {
        const res = await request(app.getHttpServer()).get('/users/valid/check-lock-status');
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch('valid is not locked');
    })

    it('checking lock status of a locke user should not need authentication', async () => {
        const res = await request(app.getHttpServer()).get('/users/locked/check-lock-status');
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch('locked is locked');
    })
});


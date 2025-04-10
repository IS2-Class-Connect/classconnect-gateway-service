import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ProxyModule } from '../src/proxy/proxy.module';
import { startMockUserService } from './mock-user.service';
import { startMockEducationService } from './mock-education.service';
import { FirebaseAuthGuard } from '../src/auth/firebase-auth.guard';

const mockFirebaseAdmin = {
    auth: () => ({
        verifyIdToken: jest.fn().mockResolvedValue({
            uid: 'abc123',
            email: 'test@example.com',
            name: 'Mock user',
            picture: 'https://mock.avatar',
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
});


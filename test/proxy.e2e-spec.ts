import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ProxyModule } from '../src/proxy/proxy.module';
import { startMockUserService } from './mock-user.service';
import { startMockCourseService } from './mock-course.service';

describe('ProxyController (e2e)', () => {
    let app: INestApplication;
    let userServer, courseServer;

    beforeAll(async () => {
        userServer = startMockUserService(3001);
        courseServer = startMockCourseService(3002);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ProxyModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
        userServer.close();
        courseServer.close();
    });

    it('GET /users/ping should proxy to user service', async () => {
        const res = await request(app.getHttpServer()).get("/users/ping")
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Pong from users service' });
    });

    it('GET /courses/ping should proxy to course service', async () => {
        const res = await request(app.getHttpServer()).get('/courses/ping');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Pong from courses service' });
    });

    it('GET /unknown/path should return 400', async () => {
        const res = await request(app.getHttpServer()).get('/unknown/ping');
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Unknown service/);
    });
});


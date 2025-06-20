import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { GatewayModule } from '../src/controllers/gateway.module';
import { startMockUserService } from './mock-user.service';
import { startMockEducationService } from './mock-education.service';
import { startMockAdminsService } from './mock-admins.service';
import { NotificationService } from '../src/services/notification.service';

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
    updateUser: jest.fn((uid, { email }) => {
      return Promise.resolve({
        uid,
        email,
        name: 'Test User',
      });
    }),
    getUser: jest.fn((uid) => {
      return Promise.resolve({
        uid,
        email: 'test@example.com',
      });
    }),
  }),
};


describe('ProxyController (e2e)', () => {
  let app: INestApplication;
  let userServer, educationServer, adminsServer, notificationService;

  beforeAll(async () => {
    userServer = startMockUserService(3001);
    educationServer = startMockEducationService(3002);
    adminsServer = startMockAdminsService(3004);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GatewayModule],
    })
      .overrideProvider('FIREBASE_ADMIN')
      .useValue(mockFirebaseAdmin)
      .compile();

    notificationService = moduleFixture.get<NotificationService>(NotificationService);
    jest.spyOn(notificationService, 'notifyUser').mockImplementation(async () => Promise.resolve());
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    userServer.close();
    educationServer.close();
    adminsServer.close();
  });

  it('GET /users/ping should proxy to users service', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/ping')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Pong from users service' });
  });

  it('GET /courses/ping should proxy to education service', async () => {
    const res = await request(app.getHttpServer())
      .get('/courses/ping')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Pong from education service' });
  });

  it('GET /evaluations/ping should proxy to education service', async () => {
    const res = await request(app.getHttpServer())
      .get('/evaluations/ping')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Pong from education service' });
  });

  it('GET /unknown/path should return 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/unknown/ping')
      .set('Authorization', 'Bearer mock-token')

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unknown service/);
  });

  it('GET / should return 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/')
      .set('Authorization', 'Bearer mock-token')

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No service was provided/);
  });

  it('GET /users when the users service is down should return 500', async () => {
    userServer.close()

    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer mock-token')

    expect(res.status).toBe(500);

    userServer = startMockUserService(3001)
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

  it('GET /users/me should proxy and resolve to actual user info using UID from Firebase', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      uid: 'test-uid',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('PATCH /users/me should update user email and proxy the patch', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', 'Bearer mock-token')
      .send({ email: 'new@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toEqual('Patched user');
  });

  it('GET /admins/ping should proxy to admins service', async () => {
    const res = await request(app.getHttpServer())
      .get('/admins/ping')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Pong from admins service' });
  });

  it('POST /admins should proxy to admins service', async () => {
    const res = await request(app.getHttpServer())
      .post('/admins')
      .set('Authorization', 'Bearer mock-token')
      .send({ name: 'New Admin' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Created admin' });
  });

  it('POST /notifications should notify a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/notifications')
      .set('Authorization', 'Bearer gateway-token')
      .send({
        uuid: 'test-uid',
        title: 'Test Notification',
        body: 'You have a new message.',
        topic: 'general',
      });

    expect(response.status).toBe(201);
    expect(notificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'test-uid',
        email: expect.any(String),
      }),
      'Test Notification',
      'You have a new message.',
      'general',
    );
  });

  it(`POST /notifications should return an error if the user doesn't exist`, async () => {
    const response = await request(app.getHttpServer())
      .post('/notifications')
      .set('Authorization', 'Bearer gateway-token')
      .send({
        uuid: 'fail-uid',
        title: 'Test Notification',
        body: 'You have a new message.',
        topic: 'general',
      });

    expect(response.status).toBe(404);
  })

  it(`POST /email/rules should return an error if users service fails to deliver the users`, async () => {
    const response = await request(app.getHttpServer())
      .post('/email/rules')
      .set('Authorization', 'Bearer gateway-token')
      .send({ rules: [] });

    expect(response.status).toBe(500);
  })

  it('GET /admin-backend/users/ping should ping the users service', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin-backend/users/ping')
      .set('Authorization', 'Bearer gateway-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Pong from users service' });
  });
});

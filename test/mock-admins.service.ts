import express from 'express';

export function startMockAdminsService(port: number) {
  const app = express();
  app.use(express.json());

  app.get('/admins/ping', (_req, res) => {
    res.json({ message: 'Pong from admins service' });
  });

  app.post('/admins', (_req, res) => {
    res.json({ message: 'Created admin' });
  });

  return app.listen(port);
}

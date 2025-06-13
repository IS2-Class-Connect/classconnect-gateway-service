import express from 'express';

export function startMockEducationService(port: number) {
  const app = express();
  app.use(express.json());

  app.get('/courses/ping', (_req, res) => {
    res.json({ message: 'Pong from education service' })
  });

  app.get('/evaluations/ping', (_req, res) => {
    res.json({ message: 'Pong from education service' })
  });

  return app.listen(port);
}

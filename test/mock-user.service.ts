import express from 'express';

export function startMockUserService(port: number) {
    const app = express();
    app.use(express.json());
    app.get('/users/ping', (_req, res) => {
        res.json({ message: 'Pong from users service' });
    });
    app.post('/users', (_req, res) => {
        res.json({ message: 'Created user' });
    })
    return app.listen(port);
}


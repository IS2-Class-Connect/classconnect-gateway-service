import express from 'express';

export function startMockUserService(port: number) {
    const app = express();
    app.use(express.json());
    app.get('/user/ping', (_req, res) => {
        res.json({ message: 'Pong from user service' });
    });
    return app.listen(port);
}


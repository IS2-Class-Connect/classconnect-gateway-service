import express from 'express';

export function startMockCourseService(port: number) {
    const app = express();
    app.use(express.json());
    app.get('/ping', (_req, res) => {
        res.json({ message: 'Pong from courses service' })
    });
    return app.listen(port);
}

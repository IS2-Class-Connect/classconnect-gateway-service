import express from 'express';

export function startMockCoursesService(port: number) {
    const app = express();
    app.use(express.json());
    app.get('/courses/ping', (_req, res) => {
        res.json({ message: 'Pong from courses service' })
    });
    return app.listen(port);
}

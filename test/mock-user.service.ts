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
    app.get('/users/:id/check-lock-status', (req, res) => {
        let id = req.params.id;
        if (id == "locked") {
            res.json({ message: `${id} is locked`});
        } else {
            res.json({ message: `${id} is not locked`});
        }
    })
    return app.listen(port);
}


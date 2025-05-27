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

    app.get('/users/test-uid', (_req, res) => {
        res.status(200).json({
            uid: 'test-uid',
            name: 'Test User',
            email: 'test@example.com',
        });
    });

    app.get('/users/fail-uid', (_req, res) => {
        res.status(404).json({
            message: 'User was not found'
        })
    })

    app.patch('/users/:id', (req, res) => {
        let id = req.params.id;
        const { email } = req.body;
        res.status(200).json({
            uid: id,
            email: email,
            message: 'Patched user',
        });
    })

    app.patch('/users/:id/lock-status', (req, res) => {
        let id = req.params.id;
        const { locked } = req.body;
        res.status(200).json({
            uid: id,
            locked,
            message: (locked ? 'locked' : 'unlocked') + ' user',
        })
    })

    return app.listen(port);
}


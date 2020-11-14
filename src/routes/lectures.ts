import { Express, Router } from 'express';

export default function (app: Express): Router {
    const router = Router();

    router.get('/', (req, res) => {
        // Return nothing for now
        res.sendStatus(204);
    });

    return router;
}

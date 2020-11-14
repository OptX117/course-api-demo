import { Express, Router } from 'express';

import registerLecturesRoutes from './lectures';

export default function registerRoutes(app: Express): Router {
    const router = Router();
    router.use('/lectures', registerLecturesRoutes(app));

    return router;
}

import { Express, Router } from 'express';

import registerCoursesRoutes from './courses';

export default function registerRoutes(app: Express): Router {
    const router = Router();
    router.use('/courses', registerCoursesRoutes(app));

    return router;
}

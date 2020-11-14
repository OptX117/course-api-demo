import { Express, Router } from 'express';

import registerCoursesRoutes from './courses';
import registerUsersRoutes from './users';

/**
 * Registers all possible routes for this app
 *
 * @openapi
 * components:
 *  securitySchemes:
 *   cookieAuth:
 *    type: apiKey
 *    in: cookie
 *    name: JSESSIONID
 *   bearerAuth:
 *    type: apiKey
 *    in: header
 *    name: Authorization Bearer
 *
 * @param {e.Express} app
 * @returns {e.Router}
 */
export default function registerRoutes(app: Express): Router {
    const router = Router();
    router.use('/courses', registerCoursesRoutes(app));
    router.use('/users', registerUsersRoutes(app))
    return router;
}

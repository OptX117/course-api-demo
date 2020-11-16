import { Express, Router } from 'express';
import { AuthService, BookingService, SchemaService, User, UserService } from '../types';
import Constants from '../constants';

export default function (app: Express): Router {
    const router = Router();
    const userService: UserService = app.get(Constants.UserService);
    const authService: AuthService = app.get(Constants.AuthorizationService);
    const schemaService: SchemaService = app.get(Constants.SchemaValidationService);
    const bookingService: BookingService = app.get(Constants.BookingService);

    /**
     * @openapi
     * paths:
     *  /users/me:
     *   get:
     *    operationId: getCurrentUser
     *    tags:
     *     - Users
     *    summary: "Get the currently logged in user"
     *    responses:
     *     200:
     *      description: "OK - the currently logged in user"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/User"
     *     4XX:
     *      description: "unauthorized, not logged in"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     */
    router.get('/me', authService.authorize(), async (req, res) => {
        const username = req.params['username'];

        const user = await userService.getUser(username);

        if (user == null) {
            res.sendStatus(401);
        } else {
            res.status(200);
            res.json(user);
        }
    });

    /**
     * @openapi
     * paths:
     *  /users/login:
     *   post:
     *    operationId: getUserInfo
     *    tags:
     *     - Users
     *    summary: "Log in"
     *    responses:
     *     200:
     *      description: "OK - logged in user and generated a JWT token"
     *      content:
     *       application/json:
     *        schema:
     *         allOf:
     *          - $ref: "#/components/schemas/User"
     *          - type: object
     *            properties:
     *             token:
     *              type: string
     *            required:
     *             - token
     *      headers:
     *        Set-Cookie:
     *         description: "Contains the JWT token as http only, secure, same site strict cookie, same as in body."
     *         schema:
     *           type: string
     *         explode: true
     *     204:
     *      description: "OK No Content - Already logged in. Get user info via /users/me"
     *     401:
     *      description: "login failed - password or username bad"
     *    requestBody:
     *     $ref: "#/components/requestBodies/Login"
     */
    router.post('/login',
        schemaService.validateRequest('login.requestbody.schema.json', []),
        authService.checkUsername(),
        async (req, res) => {
            if (req.params.username != null) {
                res.sendStatus(204);
                return;
            }

            const {username, password} = req.body;

            const loggedInUser = await authService.logIn(username, password);
            if (loggedInUser != null) {
                res.status(200);
                res.cookie('jsession', loggedInUser.token, {httpOnly: true, sameSite: 'strict', path: '/'});
                res.json(loggedInUser);
            } else {
                res.sendStatus(401);
            }
        });

    /**
     * @openapi
     * /users/bookings:
     *   get:
     *    operationId: getCurrentUser
     *    tags:
     *     - Users
     *    summary: "Get the currently logged in user"
     *    responses:
     *     200:
     *      description: "OK - all bookings of currently logged in user"
     *      content:
     *       application/json:
     *        schema:
     *         type: array
     *         items:
     *          $ref: "#/components/schemas/CourseDateBooking"
     *     4XX:
     *      description: "unauthorized, not logged in"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     */
    router.get('/bookings',
        authService.authorize(), async (req, res) => {
            res.json(await bookingService.getAllUserBookings(await userService.getUserById(req.params.userid) as User));
        });

    return router;
}

/**
 * @openapi
 * components:
 *  requestBodies:
 *   Login:
 *    required: true
 *    description: "Login request"
 *    content:
 *     application/json:
 *      schema:
 *        type: object
 *        properties:
 *         username:
 *          type: string
 *         password:
 *          type: string
 *        required:
 *         - username
 *         - password
 */

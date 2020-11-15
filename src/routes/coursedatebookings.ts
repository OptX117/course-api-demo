import { Express, Router } from 'express';
import Constants from '../constants';
import { AuthService, BookingService, CourseService, SchemaService, User, UserService } from '../types';
import logger from '../winston';

/**
 * Registers all routes under /courses/:id/dates/:id/bookings
 * @param {e.Express} app
 * @returns {e.Router} A router with all routes under /courses/:id/dates/:Id/bookings registered
 *
 */
export default function (app: Express): Router {
    const router = Router();
    const courseService: CourseService = app.get(Constants.CourseService);
    const userService: UserService = app.get(Constants.UserService);
    const bookingService: BookingService = app.get(Constants.BookingService);
    const authService: AuthService = app.get(Constants.AuthorizationService);
    const schemaService: SchemaService = app.get(Constants.SchemaValidationService);

    /**
     * @openapi
     * /courses/{courseid}/dates/{dateid}/bookings:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *    - $ref: "#/components/parameters/CourseDateId"
     *   get:
     *    operationId: getCourseDateBookings
     *    summary: "Get bookings for the current user or all bookings if user is lecturer, for a date the course is held at"
     *    tags:
     *     - Courses
     *     - Dates
     *     - Bookings
     *    responses:
     *     200:
     *      description: "OK - returning bookings"
     *      content:
     *       application/json:
     *        schema:
     *         type: array
     *         items:
     *          $ref: "#/components/schemas/CourseDateBooking"
     *     404:
     *      description: "Not Found - Course or date does not exist"
     *     4XX:
     *      description: "unauthorized, log in first"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     */
    router.get('/:courseid/dates/:dateid/bookings',
        authService.authorize(),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            if (course != null) {
                // User should already have been found, otherwise auth would have failed
                const user = await userService.getUserById(req.params.userid) as User;
                res.json(await bookingService.getBookings(course, user));
            } else {
                res.sendStatus(404);
            }
        });

    /**
     * @openapi
     * /courses/{courseid}/dates/{dateid}/bookings:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *    - $ref: "#/components/parameters/CourseDateId"
     *   post:
     *    operationId: addCourseDateBooking
     *    summary: "Add a booking to the course date"
     *    tags:
     *     - Courses
     *     - Dates
     *     - Bookings
     *    requestBody:
     *      $ref: "#/components/requestBodies/CourseDateBooking"
     *    responses:
     *     201:
     *      description: "OK - the booking was added to the course date"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/CourseDateBooking"
     *     404:
     *      description: "Not Found - Course or date does not exist"
     *     4XX:
     *      description: "unauthorized, log in first"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     */
    router.post('/:courseid/dates/:dateid/bookings',
        authService.authorize(),
        schemaService.validateRequest('coursedatebooking.requestbody.schema.json', ['./']),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            const date = course?.dates.find(date => date.id === req.params.dateid);
            if (date != null && course != null) {
                // User should already have been found, otherwise auth would have failed
                const user = await userService.getUserById(req.params.userid) as User;

                const booking = await bookingService.bookSpots(course, user, req.body.spots, date.id).catch(err => {
                    logger.error('Could not book spots!', {err});
                });

                if (booking != null) {
                    res.json(booking);
                } else {
                    res.sendStatus(400);
                }
            } else {
                res.sendStatus(404);
            }

        });

    /**
     * @openid
     *  /courses/{courseid}/dates/{dateid}/bookings/{bookingid}:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *    - $ref: "#/components/parameters/CourseDateId"
     *    - $ref: "#/components/parameters/CourseDateBookingId"
     *   get:
     *    operationId: getCourseDateBooking
     *    summary: "Get a specific booking for a course date"
     *    tags:
     *     - Courses
     *     - Dates
     *     - Bookings
     *    responses:
     *     200:
     *      description: "OK - returning booking"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/CourseDateBooking"
     *     404:
     *      description: "Not Found - Course, date or booking does not exist"
     *     4XX:
     *      description: "unauthorized, not current user's booking, or log in first"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     */
    router.get('/:courseid/dates/:dateid/bookings/:bookingid',
        authService.authorize(),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            const date = course?.dates.find(date => date.id === req.params.dateid);
            if (date != null && course != null) {
                const booking = await bookingService.getBooking(req.params.bookingid);
                if (booking != null) {
                    res.json(booking);
                    return;
                }
            }

            res.sendStatus(404);
        });

    /**
     * @openid
     *  /courses/{courseid}/dates/{dateid}/bookings/{bookingid}:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *    - $ref: "#/components/parameters/CourseDateId"
     *    - $ref: "#/components/parameters/CourseDateBookingId"
     *   put:
     *    operationId: updateCourseDateBooking
     *    summary: "Update a single booking for a course date"
     *    tags:
     *     - Courses
     *     - Dates
     *     - Bookings
     *    requestBody:
     *      $ref: "#/components/requestBodies/CourseDateBooking"
     *    responses:
     *     200:
     *      description: "OK - booking was updated"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/CourseDateBooking"
     *     404:
     *      description: "Not Found - Course, date or booking does not exist"
     *     4XX:
     *      description: "unauthorized, not current user's booking, or log in first"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     */
    router.put('/:courseid/dates/:dateid/bookings/:bookingid',
        authService.authorize(),
        schemaService.validateRequest('coursedatebooking.requestbody.schema.json', ['./']),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            const date = course?.dates.find(date => date.id === req.params.dateid);
            if (course == null || date == null) {
                res.sendStatus(404);
            } else {
                const user = await userService.getUserById(req.params.userid) as User;
                const booking = await bookingService.getBooking(req.params.bookingid);
                if (booking != null) {
                    if (user.id !== booking.user.toString()) {
                        res.sendStatus(403);
                    } else {
                        res.json(await bookingService.updateBooking(req.params.bookingid, req.body, user));
                    }
                } else {
                    res.sendStatus(404);
                }
            }

        });

    /**
     * @openapi
     * /courses/{courseid}/dates/{dateid}/bookings/{bookingid}:
     *  parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *    - $ref: "#/components/parameters/CourseDateId"
     *    - $ref: "#/components/parameters/CourseDateBookingId"
     *  delete:
     *   operationId: deleteCourseDateBooking
     *   summary: "Delete a specific booking for a course date"
     *   tags:
     *    - Courses
     *    - Dates
     *    - Bookings
     *   responses:
     *    200:
     *     description: "OK - returning deleted booking"
     *     content:
     *      application/json:
     *       schema:
     *        $ref: "#/components/schemas/CourseDateBooking"
     *    404:
     *     description: "Not Found - Course, date or booking does not exist"
     *    4XX:
     *     description: "unauthorized, not current user's booking, or log in first"
     *   security:
     *    - cookieAuth: []
     *    - bearerAuth: []
     */
    router.delete('/:courseid/dates/:dateid/bookings/:bookingid',
        authService.authorize(),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            const date = course?.dates.find(date => date.id === req.params.dateid);
            if (course == null || date == null) {
                res.sendStatus(404);
            } else {
                const user = await userService.getUserById(req.params.userid) as User;
                const booking = await bookingService.getBooking(req.params.bookingid);
                if (booking != null) {
                    if (!user.isLecturer && course.lecturer.id !== user.id && user.id !== booking.user.toString()) {
                        res.sendStatus(403);
                    } else {
                        res.json(await bookingService.deleteBooking(req.params.bookingid, user));
                    }
                } else {
                    res.sendStatus(404);
                }
            }
        });

    return router;
}



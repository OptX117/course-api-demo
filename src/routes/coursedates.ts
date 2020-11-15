import { Express, Router } from 'express';
import Constants from '../constants';
import { AuthService, CourseDate, CourseService, SchemaService } from '../types';
import registerCourseDateBookingsRoutes from './coursedatebookings';
/**
 * Registers all routes under /courses/:id/dates
 * @param {e.Express} app
 * @returns {e.Router} A router with all routes under /courses/:id/dates registered
 *
 * @openapi
 * components:
 *  requestBodies:
 *   CourseDateBooking:
 *    required: true
 *    description: "Booking to be added to a course date"
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        spots:
 *         type: number
 *         minimum: 1
 *       required:
 *        - spots
 *   CourseDateChange:
 *    required: true
 *    description: "Changes to a course date"
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        startdate:
 *         type: string
 *         format: date-time
 *        enddate:
 *         type: string
 *         format: date-time
 *        totalSpots:
 *         type: number
 *         minimum: 1
 *       additionalProperties: false
 *  parameters:
 *   CourseDateId:
 *    name: dateid
 *    in: path
 *    required: true
 *    description: "the Id of a date the course is being held at"
 *    schema:
 *     type: number
 *   CourseDateBookingId:
 *    name: bookingid
 *    in: path
 *    required: true
 *    description: "the Id of a booking for a course date"
 *    schema:
 *     type: number
 */
export default function (app: Express): Router {
    const router = Router();
    const courseService: CourseService = app.get(Constants.CourseService);
    const authService: AuthService = app.get(Constants.AuthorizationService);
    const schemaService: SchemaService = app.get(Constants.SchemaValidationService);

    /**
     * @openapi
     *  /courses/{courseid}/dates:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *   get:
     *    operationId: getCourseDates
     *    summary: "Get all dates a single course is held at"
     *    tags:
     *     - Courses
     *     - Dates
     *    responses:
     *     200:
     *      description: "OK - a list of dates the course is held at"
     *      content:
     *       application/json:
     *        schema:
     *         type: array
     *         items:
     *          $ref: "#/components/schemas/CourseDate"
     *     404:
     *      description: "Not Found - Course does not exist"
     */
    router.get('/:courseid/dates', async (req, res) => {
        const course = await courseService.getCourse(req.params.courseid);
        if (course != null) {
            res.json(course.dates);
        } else {
            res.sendStatus(404);
        }
    });

    /**
     * @openapi
     * /courses/{courseid}/dates:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *   post:
     *    operationId: addCourseDate
     *    summary: "Add a date to a course"
     *    tags:
     *     - Courses
     *     - Dates
     *    requestBody:
     *      $ref: "#/components/requestBodies/CourseDate"
     *    responses:
     *     201:
     *      description: "OK - the date was added to the course"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/CourseDate"
     *     404:
     *      description: "Not Found - Course does not exist"
     *     4XX:
     *      description: "unauthorized, log in as the lecturer of the course first"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     * components:
     *  requestBodies:
     *   CourseDate:
     *    required: true
     *    description: "Date to be added to a course"
     *    content:
     *     application/json:
     *      schema:
     *        type: object
     *        properties:
     *         startDate:
     *          type: string
     *          format: date-time
     *         endDate:
     *          type: string
     *          format: date-time
     *         totalSpots:
     *          type: number
     *          minimum: 1
     *        required:
     *         - startDate
     *         - endDate
     *         - totalSpots
     *        additionalProperties: false
     */
    router.post('/:courseid/dates',
        authService.authorize(true),
        schemaService.validateRequest('coursedate.requestbody.schema.json', ['./']),
        async (req, res) => {
            const newDate = req.body as Omit<CourseDate, 'id'>;
            const savedDate = await courseService.addCourseDate(req.params.courseid, newDate);

            if (savedDate != null) {
                res.json(savedDate);
            } else {
                res.sendStatus(404);
            }
        });

    /**
     * @openid
     * /courses/{courseid}/dates/{dateid}:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *    - $ref: "#/components/parameters/CourseDateId"
     *   get:
     *    operationId: getCourseDate
     *    summary: "Get a single date the course is held at"
     *    tags:
     *     - Courses
     *     - Dates
     *    responses:
     *     200:
     *      description: "OK - date was found"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/CourseDate"
     *     404:
     *      description: "Not Found - Course or date does not exist"
     */
    router.get('/:courseid/dates/:dateid', async (req, res) => {
        const course = await courseService.getCourse(req.params.courseid);
        if (course != null) {
            const date = course.dates.find(date => date.id === req.params.dateid);
            if (date != null) {
                res.json(date);
                return;
            }
        }
        res.sendStatus(404);
    });

    /**
     * @openid
     * /courses/{courseid}/dates/{dateid}:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *    - $ref: "#/components/parameters/CourseDateId"
     *   put:
     *    operationId: updateCourseDate
     *    summary: "Update a single date the course is held at"
     *    tags:
     *     - Courses
     *     - Dates
     *    requestBody:
     *      $ref: "#/components/requestBodies/CourseDateChange"
     *    responses:
     *     200:
     *      description: "OK - date was updated"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/CourseDate"
     *     404:
     *      description: "Not Found - Course or date does not exist"
     *     4XX:
     *      description: "unauthorized, log in as the lecturer of the course first"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     * components:
     *  requestBodies:
     *
     */
    router.put('/:courseid/dates/:dateid',
        authService.authorize(true),
        schemaService.validateRequest('coursedatechange.requestbody.schema.json', ['./']),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            if (course == null) {
                res.sendStatus(404);
            } else if (course.lecturer.id !== req.params.userid) {
                res.sendStatus(403);
            } else {
                const date = course.dates.find(date => date.id === req.params.dateid);
                if (date == null) {
                    res.sendStatus(404);
                } else {
                    const updatedCourse = await courseService.updateCourseDate(req.params.courseid,
                        req.params.dateid,
                        req.body);
                    if (updatedCourse != null) {
                        res.json(updatedCourse);
                        return;
                    }
                }
            }
        });

    /**
     * @openapi
     *  /courses/{courseid}/dates/{dateid}:
     *   parameters:
     *    - $ref: "#/components/parameters/CourseId"
     *    - $ref: "#/components/parameters/CourseDateId"
     *   delete:
     *    operationId: deleteCourseDate
     *    summary: "Delete a single date the course is held at"
     *    tags:
     *     - Courses
     *     - Dates
     *    responses:
     *     200:
     *      description: "OK - date was deleted"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/CourseDate"
     *     404:
     *      description: "Not Found - Course or date does not exist"
     *     4XX:
     *      description: "unauthorized, log in as the lecturer of the course first"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     */
    router.delete('/:courseid/dates/:dateid',
        authService.authorize(true),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            if (course == null) {
                res.sendStatus(404);
            } else if (course.lecturer.id !== req.params.userid) {
                res.sendStatus(403);
            } else {
                const date = course.dates.find(date => date.id === req.params.dateid);
                if (date == null) {
                    res.sendStatus(404);
                } else {
                    const deletedDate = await courseService.deleteCourseDate(req.params.courseid, req.params.dateid);
                    if (deletedDate != null) {
                        res.json(deletedDate);
                        return;
                    }
                }
            }
        });


    router.use(registerCourseDateBookingsRoutes(app));


    return router;
}



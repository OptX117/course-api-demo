import { Express, Router } from 'express';
import Constants from '../constants';
import { AuthService, Course, CourseService, SchemaService } from '../types';

/**
 * Registers all routes under /courses
 * @param {e.Express} app
 * @returns {e.Router} A router with all routes under /courses registered
 *
 * @openapi
 * components:
 *  schemas:
 *   Course:
 *     description: "An object reflecting a course than can be booked"
 *     type: object
 *     properties:
 *      id:
 *       type: number
 *       minimum: 0
 *      title:
 *       type: string
 *      description:
 *       type: string
 *      lecturer:
 *       type: number
 *      price:
 *       type: number
 *      dates:
 *       type: array
 *       items:
 *        $ref: "#/components/schemas/CourseDate"
 *      category:
 *        $ref: "#/components/schemas/CourseCategory"
 *      organiser:
 *       type: string
 *     required:
 *      - id
 *      - title
 *      - lecturer
 *      - price
 *      - category
 *  requestBodies:
 *   Course:
 *    required: true
 *    description: "Course to be created"
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        title:
 *         type: string
 *        description:
 *         type: string
 *        lecturer:
 *         type: string
 *        price:
 *         type: number
 *        dates:
 *         type: array
 *         items:
 *          $ref: "#/components/schemas/CourseDate"
 *        category:
 *          $ref: "#/components/schemas/CourseCategory"
 *        organiser:
 *         type: string
 *       required:
 *        - title
 *        - lecturer
 *        - price
 *        - category
 *   CourseChange:
 *    required: true
 *    description: "Changes to be made to the course"
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        title:
 *         type: string
 *        description:
 *         type: string
 *        lecturer:
 *         type: string
 *        price:
 *         type: number
 *        dates:
 *         type: array
 *         items:
 *          $ref: "#/components/schemas/CourseDate"
 *        category:
 *          $ref: "#/components/schemas/CourseCategory"
 *        organiser:
 *         type: string
 *       additionalProperties: false
 */
export default function (app: Express): Router {
    const router = Router();
    const courseService: CourseService = app.get(Constants.CourseService);
    const authService: AuthService = app.get(Constants.AuthorizationService);
    const schemaService: SchemaService = app.get(Constants.SchemaValidationService);

    /**
     * @openapi
     * /courses:
     *   get:
     *    operationId: getCourseList
     *    tags:
     *     - Courses
     *    summary: "Gets a list of courses"
     *    parameters:
     *     - name: start
     *       in: query
     *       description: "Startdate to filter from. Inclusive."
     *       schema:
     *        type: string
     *        format: date
     *       style: form
     *       example: "2020-11-12T16:54:29.271Z"
     *     - name: end
     *       in: query
     *       description: "Enddate to filter to. Inclusive."
     *       schema:
     *        type: string
     *        format: date
     *       style: form
     *       example: "2020-11-12T16:54:29.271Z"
     *    responses:
     *      200:
     *       description: "OK - a list of all courses"
     *       content:
     *        application/json:
     *         schema:
     *          type: array
     *          items:
     *           $ref: "#/components/schemas/Course"
     *       links:
     *         courseId:
     *          operationId: getCourse
     *          parameters:
     *           courseid: "$response.body#/*\/id"
     */
    router.get('/', async (req, res) => {
        res.status(200);
        res.json(await courseService.getAllCourses());
    });

    /**
     * @openapi
     * /courses:
     *   post:
     *    operationId: createCourse
     *    tags:
     *     - Courses
     *    summary: "Create a new course entry"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     *    requestBody:
     *     $ref: "#/components/requestBodies/Course"
     *    responses:
     *     4XX:
     *      description: "unauthorized - log in as lecturer first"
     *     201:
     *      description: "OK - the created course being returned"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/Course"
     *      links:
     *       id:
     *        operationId: getCourse
     *        parameters:
     *         courseid: $response.body#/id
     */
    router.post('/',
        authService.authorize(true),
        schemaService.validateRequest('course.requestbody.schema.json', ['./']),
        async (req, res) => {
            const newCourse = req.body as Omit<Course, 'id' | 'lecturer'> & { lecturer: string };
            // Return nothing for now
            const savedCourse = await courseService.addCourse(newCourse);
            if (savedCourse != null) {
                res.json(savedCourse);
            } else {
                res.sendStatus(400);
            }
        });

    /**
     * @openapi
     *  /courses/{courseid}:
     *   parameters:
     *   - $ref: "#/components/parameters/CourseId"
     *   get:
     *    operationId: getCourse
     *    tags:
     *      - Courses
     *    summary: "Get a single course"
     *    responses:
     *     200:
     *      description: "the course"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/Course"
     *      links:
     *       getCourseDates:
     *        operationId: getCourseDates
     *        parameters:
     *         courseid: $response.body#/id
     *       getCourseDate:
     *        operationId: getCourseDate
     *        parameters:
     *         courseid: $response.body#/id
     *     404:
     *      description: "Not Found - Course does not exist"
     */
    router.get('/:id', async (req, res) => {
        const course = await courseService.getCourse(req.params.id);
        if (course != null) {
            res.json(course);
        } else {
            res.sendStatus(404);
        }
    });

    /**
     * @openapi
     * /courses/{courseid}:
     *  parameters:
     *   - $ref: "#/components/parameters/CourseId"
     *  put:
     *    operationId: updateCourse
     *    tags:
     *     - Courses
     *    summary: "Update a single course"
     *    requestBody:
     *     $ref: "#/components/requestBodies/CourseChange"
     *    responses:
     *     404:
     *      description: "Not Found - Course does not exist"
     *     4XX:
     *      description: "unauthorized, log in as lecturer of the course first"
     *     200:
     *      description: "the updated course"
     *      content:
     *       application/json:
     *        schema:
     *         $ref: "#/components/schemas/Course"
     *    security:
     *     - cookieAuth: []
     *     - bearerAuth: []
     */
    router.put('/:id',
        authService.authorize(true),
        schemaService.validateRequest('coursechange.requestbody.schema.json', ['./']),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.id);
            if (course != null && course.lecturer.id === req.params.userid) {
                const updatedCourse = await courseService.updateCourse(req.params.id, req.body);
                if (updatedCourse != null) {
                    res.json(updatedCourse);
                    return;
                }
            }
            res.sendStatus(404);
        }
    );
    return router;
}
/**
 * @openapi
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
 *         startdate:
 *          type: string
 *          format: date-time
 *         enddate:
 *          type: string
 *          format: date-time
 *         totalSpots:
 *          type: number
 *          minimum: 1
 *         availableSpots:
 *             type: number
 *             minimum: 0
 *        required:
 *         - startdate
 *         - enddate
 *         - totalSpots
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
 *  parameters:
 *   CourseId:
 *    name: courseid
 *    in: path
 *    required: true
 *    description: "the Id of the course"
 *    schema:
 *     type: number
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
 *
 */

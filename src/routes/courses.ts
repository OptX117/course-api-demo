import { Express, Router } from 'express';
import Constants from '../constants';
import { AuthService, Course, CourseService, SchemaService } from '../types';
import registerCourseDatesRoutes from './coursedates';

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
 *  parameters:
 *   CourseId:
 *    name: courseid
 *    in: path
 *    required: true
 *    description: "the Id of the course"
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
     * /api/v1/courses:
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

        const start = Array.isArray(req.query.start) ? req.query.start[0] : req.query.start;
        if(start && typeof start !== 'string') {
            res.status(400);
            return;
        }
        const end = Array.isArray(req.query.end) ? req.query.end[0] : req.query.end;
        if(end && typeof end !== 'string') {
            res.status(400);
            return;
        }

        res.json(await courseService.getAllCourses(start, end));
    });

    /**
     * @openapi
     * /api/v1/courses:
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
     *  /api/v1/courses/{courseid}:
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
    router.get('/:courseid', async (req, res) => {
        const course = await courseService.getCourse(req.params.courseid);
        if (course != null) {
            res.json(course);
        } else {
            res.sendStatus(404);
        }
    });

    /**
     * @openapi
     * /api/v1/courses/{courseid}:
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
    router.put('/:courseid',
        authService.authorize(true),
        schemaService.validateRequest('coursechange.requestbody.schema.json', ['./']),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            if (course == null) {
                res.sendStatus(404);
            } else if (course.lecturer.id !== req.params.userid) {
                res.sendStatus(403);
            } else {

                const updatedCourse = await courseService.updateCourse(req.params.courseid, req.body);
                if (updatedCourse != null) {
                    res.json(updatedCourse);
                    return;
                }
            }
        }
    );

    router.delete('/:courseid',
        authService.authorize(true),
        async (req, res) => {
            const course = await courseService.getCourse(req.params.courseid);
            if (course == null) {
                res.sendStatus(404);
            } else if (course.lecturer.id !== req.params.userid) {
                res.sendStatus(403);
            } else {
                const deletedCourse = await courseService.deleteCourse(req.params.courseid);
                if (deletedCourse != null) {
                    res.json(deletedCourse);
                    return;
                }
            }
        }
    );


    router.use(registerCourseDatesRoutes(app));

    return router;
}



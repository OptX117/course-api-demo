import { Express, Router } from 'express';
import Constants from '../constants';
import { CourseService } from '../types';

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
 *         type: number
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
 */
export default function (app: Express): Router {
    const router = Router();
    const courseService: CourseService = app.get(Constants.CourseService);

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
    router.get('/', (req, res) => {
        res.status(200);
        res.json(courseService.getAllCourses());
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
    router.post('/', (req, res) => {
        // Return nothing for now
        res.sendStatus(204);
    });
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

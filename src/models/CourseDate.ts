import * as mongoose from 'mongoose';

/**
 * Represents a possible date a course is held at
 *
 * @openapi
 * components:
 *  schemas:
 *   CourseDate:
 *    type: object
 *    properties:
 *     id:
 *      type: number
 *      minimum: 0
 *     startdate:
 *      type: string
 *      format: date-time
 *     enddate:
 *      type: string
 *      format: date-time
 *     totalSpots:
 *      type: number
 *      minimum: 1
 *     availableSpots:
 *         type: number
 *         minimum: 0
 *    required:
 *     - id
 *     - startdate
 *     - enddate
 *     - totalSpots

 *
 * @type {module:mongoose.Schema<any>}
 */
export const CourseDateSchema = new mongoose.Schema({
    startdate: {
        type: 'string',
        format: 'date-time',
        required: true
    },
    enddate: {
        type: 'string',
        format: 'date-time',
        required: true
    },
    totalSpots: {
        type: 'number',
        min: 1,
        required: true
    }
});

export default mongoose.model('CourseDate', CourseDateSchema);


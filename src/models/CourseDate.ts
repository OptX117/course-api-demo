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
 *      type: string
 *     startdate:
 *      type: string
 *      format: date-time
 *     enddate:
 *      type: string
 *      format: date-time
 *     totalSpots:
 *      type: number
 *      minimum: 1
 *    required:
 *     - id
 *     - startDate
 *     - endDate
 *     - totalSpots
 *
 * @type {module:mongoose.Schema<any>}
 */
export const CourseDateSchema = new mongoose.Schema({
    id: {
        type: 'string',
        required: true
    },
    startDate: {
        type: 'string',
        format: 'date-time',
        required: true
    },
    endDate: {
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


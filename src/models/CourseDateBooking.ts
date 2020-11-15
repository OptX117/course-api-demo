import * as mongoose from 'mongoose';

/**
 * Represents a booking for a date a course is held at
 *
 * @openapi
 * components:
 *  schemas:
 *   CourseDateBooking:
 *    type: object
 *    properties:
 *     id:
 *      type: number
 *     user:
 *      type: number
 *     spots:
 *      type: number
 *      minimum: 1
 *     course:
 *      type: string
 *     date:
 *      type: string
 *    required:
 *     - id
 *     - user
 *     - spots
 *     - course
 * @type {module:mongoose.Schema<any>}
 */
export const CourseDateBookingSchema = new mongoose.Schema({
    user: {
        type: 'string',
        required: true
    },
    spots: {
        type: 'number',
        min: 1,
        required: true
    },
    course: {
        type: 'string',
        required: true
    },
    date: {
        type: 'string',
        required: true
    }
});

export default mongoose.model('CourseDateBooking', CourseDateBookingSchema);

import mongoose from 'mongoose';
import mongodb from 'mongodb'
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
        type: mongodb.ObjectId,
        required: true
    },
    spots: {
        type: 'number',
        min: 1,
        required: true
    },
    course: {
        type: mongodb.ObjectId,
        required: true
    },
    date: {
        type: 'string',
        required: true
    }
});

export default mongoose.model('CourseDateBooking', CourseDateBookingSchema);

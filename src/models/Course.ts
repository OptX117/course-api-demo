import mongoose, { Schema } from 'mongoose';
import { CourseDateSchema } from './CourseDate';


// Types sind blöd und ich habe keine Zeit sie anzupassen.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const ObjectId = mongoose.ObjectId;

/**
 * Represents a single course
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
 * @type {module:mongoose.Schema<any>}
 */

export const CourseSchema = new mongoose.Schema({
    title: {
        type: 'string',
        required: true,
        index: true
    },
    description: {
        type: 'string'
    },
    lecturer: {
        type: ObjectId,
        required: true
    },
    price: {
        type: 'number',
        required: true
    },
    dates: {
        type: 'array',
        items: {
            type: CourseDateSchema
        },
        required: true
    },
    category: ObjectId,
    organiser: {
        type: 'string'
    }
});


export default mongoose.model('Course', CourseSchema);

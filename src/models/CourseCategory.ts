import * as mongoose from 'mongoose';

/**
 * Represents a possible course category
 *
 * @openapi
 * components:
 *  schemas:
 *   CourseCategory:
 *    type: string
 *    enum: ["Konferenz", "Sprachkurs", "Meeting", "Weiterbildung"]
 *
 * @type {module:mongoose.Schema<any>}
 */
const courseCategorySchema = new mongoose.Schema({
    name: {
        type: 'string',
        enum: ['Konferenz', 'Sprachkurs', 'Meeting', 'Weiterbildung']
    }
});

export default mongoose.model('CourseCategory', courseCategorySchema);

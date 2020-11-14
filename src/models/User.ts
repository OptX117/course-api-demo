import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Represents a single user and which access level he has (user / lecturer)
 *
 * @openapi
 * components:
 *  schemas:
 *   User:
 *    type: object
 *    properties:
 *     id:
 *      type: number
 *      minimum: 0
 *     name:
 *      type: string
 *     isLecturer:
 *      type: boolean
 *    required:
 *     - id
 *     - name
 *     - isLecturer
 * @type {module:mongoose.Schema<any>}
 */

const UserSchema = new mongoose.Schema({
    name: {
        type: 'string',
        required: true,
        index: true
    },
    isLecturer: {
        type: 'boolean',
        required: true
    },
    passwordHash: {
        type: 'string',
        required: true
    },
    salt: {
        type: 'string',
        required: true
    }
});

UserSchema.methods.setPassword = function (password: string) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.passwordHash = crypto.pbkdf2Sync(password, this.salt,
        1000, 64, `sha512`).toString(`hex`);
};

UserSchema.methods.isPasswordValid = function (password: string) {
    const hash = crypto.pbkdf2Sync(password,
        this.salt, 1000, 64, `sha512`).toString(`hex`);
    return this.passwordHash === hash;
};

export default mongoose.model('User', UserSchema);

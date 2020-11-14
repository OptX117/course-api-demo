import { ValidatorResult } from 'jsonschema';
import { NextFunction, Request, Response } from 'express';

export type Environment = 'production' | 'staging' | 'development' | 'test';

export interface ConfigurationService {
    /**
     * Get an environment specific configuration
     * @returns {Promise<Readonly<Configuration>>} Promise that resolves with the loaded configuration
     */
    getConfiguration(): Promise<Readonly<Configuration>>;

    getOpenAPIDefinition(): Promise<Readonly<Record<string, unknown>>>;
}

export interface Configuration {
    /**
     * The port the app should run under
     */
    readonly port: number;
    /**
     * Mongodb connection parameters
     */
    readonly mongodb: {
        readonly host: string;
        readonly port: number;
        readonly auth: {
            readonly username: string;
            readonly password: string;
        }
    },
    /**
     * Secret key for JWT tokens
     */
    readonly jwt: string;
}

export interface SchemaStore {
    [k: string]: Promise<Record<string, unknown> | Record<string, unknown>[]>;
}

/**
 * Service for validating objects against json schemas
 */
export interface SchemaService {
    /**
     * Validate a given object against one or more schemas
     * @param {Record<string, unknown>} obj The object to validate
     * @param {string} schemaName The main schema to validate against
     * @param {string[]} additionalSchemas Additional schemas to load
     * @returns {Promise<ValidatorResult>} Resolves with any validator errors or success
     */
    validateSchema(obj: Record<string, unknown>, schemaName: string,
                   additionalSchemas?: string[]): Promise<ValidatorResult>;

    validateRequest(schemaName: string, additionalSchemas: string[], req: Request, res: Response,
                    next: NextFunction): void;
}

/**
 * Service for managing course instances and related logic
 */
export interface CourseService {
    getAllCourses(): Readonly<Course[]>;

    addCourse(course: Omit<Course, 'id'>): Course;
}

/**
 * Represents a single course
 */
export interface Course {
    id: number;
    title: string;
    description?: string;
    lecturer: User;
    price: number;
    dates: any[];
    category: CourseCategory,
    organiser?: string;
}

/**
 * Represents a single user and which access level he has (user / lecturer)
 */
export interface User {
    id: string;
    name: string;
    isLecturer: boolean;
}

export type CourseCategory =
    'Konferenz' |
    'Sprachkurs' |
    'Meeting' |
    'Weiterbildung';

/**
 * Service for authorizing requests and authenticating users
 */
export interface AuthService {
    /**
     * Check if a request contains a valid JWT in a same-site strict and secure cookie or in the Authorization header
     * @param hasToBeLecturer {boolean | undefined} Whether or not user in token has to be lecturer
     * @param name {string | undefined} The name that has to be present in token
     */
    authorize(hasToBeLecturer?: boolean, name?: string): (req: Request, res: Response, next: NextFunction) => void;

    /**
     * Log in a user with given username and password.
     * @param {string} username The user to log in
     * @param {string} password The password to check
     * @returns {(User & {token: string}) | undefined} Returns user and a JWT token if user was found and password correct, <code>undefined</code> otherwise.
     *
     */
    logIn(username: string, password: string): Promise<User & { token: string } | undefined>

    /**
     * Check if jwt token is present and if so add username to properties
     * @returns {(req: e.Request, res: e.Response, next: e.NextFunction) => void}
     */
    checkUsername(): (req: Request, res: Response, next: NextFunction) => void;
}


/**
 * Service for managing all registered users of the application and related logic
 */
export interface UserService {
    getUser(username: string): Promise<User | null>;

    addUser(username: string, password: string, lecturer: boolean): Promise<User>;

    getAllUsers(): Promise<User[]>;

    /**
     * Checks whether or not a given password is valid
     * @param {User | string} userOrUsername The user or username to check the password against
     * @param {string} password The password to check
     * @returns {boolean} <code>true</code> if valid, <code>false</code> otherwise
     */
    isPasswordValid(userOrUsername: User | string, password: string): Promise<boolean>;


}

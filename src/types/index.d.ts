import { ValidatorResult } from 'jsonschema';
import { NextFunction, Request, Response } from 'express';
import CourseDateBooking from '../models/CourseDateBooking';

export type Environment = 'production' | 'staging' | 'development' | 'test';

export interface ConfigurationService {
    /**
     * Get an environment specific configuration
     * @returns {Promise<Readonly<Configuration>>} Promise that resolves with the loaded configuration
     */
    getConfiguration(): Promise<Readonly<Configuration>>;

    /**
     * Get the open API definition file
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
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
     * Validate a given object against one or more schemas. <br>
     * Paths to schemas are relative to schema folder.
     * @param {Record<string, ?>} obj The object to validate
     * @param {string} schemaName The main schema to validate against
     * @param {string[]} additionalSchemas Additional schemas to load, can be single file or path to folder
     * @returns {Promise<ValidatorResult>} Resolves with any validator errors or success
     */
    validateSchema(obj: Record<string, unknown>, schemaName: string,
                   additionalSchemas?: string[]): Promise<ValidatorResult>;

    /**
     * Utility function to validate an incoming request against a specified set of schemas <br>
     * Paths to schemas are relative to schema folder.
     * @param {string} schemaName
     * @param {string[]} additionalSchemas
     * @returns {(req: e.Request, res: e.Response, next: e.NextFunction) => void}
     */
    validateRequest(schemaName: string, additionalSchemas: string[]): (req: Request, res: Response,
                                                                       next: NextFunction) => void;
}

export type UpdateCourse = Omit<Course, 'id' | 'lecturer'> & { lecturer: string };

/**
 * Service for managing course instances and related logic
 */
export interface CourseService {
    /**
     * Get all courses or optionally filter for start and end dates.
     * @param {string} startDate ISO 8601 string (eg. moment().toISOString())
     * @param {string} endDate ISO 8601 string (eg. moment().toISOString())
     * @returns {Promise<Readonly<Course[]>>}
     */
    getAllCourses(startDate?: string, endDate?: string): Promise<Readonly<Course[]>>;

    /**
     * Gets a course, returns undefined when not found
     * @param {string} id
     * @returns {Promise<Course | undefined>}
     */
    getCourse(id: string): Promise<Course | undefined>;

    /**
     * Deletes a course, returns undefined if not found
     * @param {string} id
     * @returns {Promise<Course | undefined>}
     */
    deleteCourse(id: string): Promise<Course | undefined>;

    getCourseCategories(): Promise<Readonly<CourseCategory[]>>;

    /**
     * Updates values of an existing course, returns undefined if not found
     * @param {string} id
     * @param {Partial<UpdateCourse>} course
     * @returns {Promise<Course | undefined>}
     */
    updateCourse(id: string, course: Partial<UpdateCourse>): Promise<Course | undefined>;

    /**
     * Adds a course, returns undefined if user is not a lecturer
     * @param {UpdateCourse} course
     * @returns {Promise<Course | undefined>}
     */
    addCourse(course: UpdateCourse): Promise<Course | undefined>;

    /**
     * Adds a course date to a course, returns undefined if user is not the lecturer of the course
     * @param {string} id
     * @param {UpdateCourseDate} date
     * @returns {Promise<CourseDate | undefined>}
     */
    addCourseDate(id: string, date: UpdateCourseDate): Promise<CourseDate | undefined>;

    /**
     * Updates a course date, returns undefined if user is not the lecturer of the course
     * @param {string} id
     * @param {string} dateid
     * @param {UpdateCourseDate} date
     * @returns {Promise<CourseDate | undefined>}
     */
    updateCourseDate(id: string, dateid: string, date: UpdateCourseDate): Promise<CourseDate | undefined>;

    /**
     * Deletes a course date, returns undefined if user is not the lecturer of the course
     * @param {string} id
     * @param {string} dateid
     * @returns {Promise<CourseDate | undefined>}
     */
    deleteCourseDate(id: string, dateid: string): Promise<CourseDate | undefined>;
}

/**
 * Represents a single course
 */
export interface Course {
    id: string;
    title: string;
    description?: string;
    lecturer: User;
    price: number;
    dates: CourseDate[];
    category: CourseCategory,
    organiser?: string;
}

export type UpdateCourseDate = Omit<CourseDate, 'id'>;

export interface CourseDate {
    id: string;
    startDate: string;
    endDate: string;
    totalSpots: number;
    location: string;
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
    'Weiterbildung' |
    'N/A';

/**
 * Service for authorizing requests and authenticating users
 */
export interface AuthService {
    /**
     * Check if a request contains a valid JWT in a same-site strict and secure cookie or in the Authorization header
     * @param hasToBeLecturer {boolean | undefined} Whether or not user in token has to be lecturer
     */
    authorize(hasToBeLecturer?: boolean): (req: Request, res: Response, next: NextFunction) => void;

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

    getUserById(userId: string): Promise<User | null>;

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

export interface CourseDateBooking {
    id: string;
    user: string;
    spots: number;
    course: string;
    date: string;
}

export type CourseDateBookingUpdate = Partial<Omit<CourseDateBooking, 'id' | 'user'>>;

/**
 * Service for managing bookings for courses
 */
export interface BookingService {
    /**
     * Book one ore more spots if available for the given course & date.
     * @param {Course} course Used to map the date
     * @param {User} user The user to book for
     * @param {number} spots How many spots to book
     * @param {string} dateId At which date to book the spots.
     * @throws Exception in the promise if not enough spots are available.
     * @returns {Promise<CourseDateBooking>}
     */
    bookSpots(course: Course, user: User, spots: number, dateId: string): Promise<CourseDateBooking>;

    /**
     * Get all bookings for a user for course, or all bookings for the course or all if user is lecturer or userOrAll is true
     * @param {Course} course The course to get all bookings for
     * @param {User | true} userOrAll The user to filter for, or a true boolean if the filter should be skipped
     * @returns {Promise<CourseDateBooking[]>} Filtered or conditionally unfiltered list of bookings for the given course and user
     */
    getBookings(course: Course, userOrAll: User | true): Promise<CourseDateBooking[]>;

    /**
     * Get all bookings of a user regardless of course
     * @param {User} user
     * @returns {Promise<CourseDateBooking[]>}
     */
    getAllUserBookings(user: User): Promise<CourseDateBooking[]>;

    getBooking(bookingId: string): Promise<CourseDateBooking | undefined>;

    updateBooking(bookingId: string, booking: CourseDateBookingUpdate, user: User): Promise<CourseDateBooking | undefined>;

    deleteBooking(bookingId: string, user: User): Promise<CourseDateBooking | undefined>;

    /**
     * Get remaining spots on a course date.
     * @param {Course} course
     * @param {string} dateId
     * @returns {Promise<number>}
     */
    getOpenSpots(course: Course, dateId: string): Promise<number>;
}

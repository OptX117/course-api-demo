import { ValidatorResult } from 'jsonschema';

export type Environment = 'production' | 'staging' | 'development' | 'test';

export interface ConfigurationService {
    /**
     * Get an environment specific configuration
     * @returns {Promise<Readonly<Configuration>>} Promise that resolves with the loaded configuration
     */
    getConfiguration(): Promise<Readonly<Configuration>>;
}

export interface Configuration {
    /**
     * The port the app should run under
     */
    readonly port: number;
}

export interface SchemaStore {
    [k: string]: Promise<Record<string, unknown> | Record<string, unknown>[]>;
}

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
}

export interface CourseService {
    getAllCourses(): Readonly<Course[]>;
    addCourse(course: Omit<Course, 'id'>): Course;
}

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

export interface User {
    id: number;
    name: string;
    isLecturer: boolean;
}

export type CourseCategory =
    'Konferenz' |
    'Sprachkurs' |
    'Meeting' |
    'Weiterbildung';

import {
    BookingService,
    Course,
    CourseCategory,
    CourseDate,
    CourseService,
    UpdateCourse,
    UpdateCourseDate,
    UserService
} from '../types';
import CourseModel from '../models/Course';
import CourseCategoryModel from '../models/CourseCategory';
import { MongooseDocument } from 'mongoose';
import logger from '../winston';
import { v4 } from 'uuid';

export default class CourseServiceImpl implements CourseService {
    private readonly userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public getAllCourses(): Promise<Readonly<Course[]>> {
        return CourseModel.find().exec().then(list => {
            return Promise.all(list.map((v) => this.convertCourseModelToCourse(v)));
        }).then(list => Object.freeze(list.filter(v => v) as Course[]));
    }

    public async addCourse(course: UpdateCourse): Promise<Course | undefined> {
        const newCourseModel = new CourseModel();

        const category = await CourseCategoryModel.findOne({name: course.category}).exec();

        const lecturer = await this.userService.getUser(course.lecturer);

        if (lecturer != null) {
            const newCourse = newCourseModel as unknown as Course;
            (newCourse as any).lecturer = lecturer.id;
            newCourse.title = course.title;
            newCourse.price = course.price;
            newCourse.organiser = course.organiser;
            newCourse.description = course.description;
            newCourse.dates = course.dates;
            (newCourse as any).category = category?._id;

            const saved = await newCourseModel.save();

            (course as any).lecturer = lecturer;

            return Object.assign({
                id: saved._id.toString()
            }, course as any);
        }
    }

    public getCourseCategories(): Promise<CourseCategory[]> {
        return CourseCategoryModel.find().exec().then(list => {
            return list.map(v => (v as any).name as CourseCategory);
        });
    }

    public addCourseCategory(cat: CourseCategory): Promise<CourseCategory> {
        const newCat = new CourseCategoryModel();
        (newCat as any).name = cat;
        return newCat.save().then(v => (v as any).name);
    }

    public async getCourse(id: string): Promise<Course | undefined> {
        return CourseModel.findOne({_id: id}).exec().then(doc => {
            if (doc != null) {
                return this.convertCourseModelToCourse(doc);
            }
        }).catch(err => {
            logger.error(`Error finding course with id ${id}`, {err});
            return undefined;
        });
    }

    public async updateCourse(id: string, course: Partial<UpdateCourse>): Promise<Course | undefined> {
        const dbCourse = await CourseModel.findOne({_id: id}).exec();

        if (dbCourse == null) {
            return Promise.resolve(undefined);
        }

        if (course.lecturer) {
            const newLecturer = await this.userService.getUser(course.lecturer);

            if (newLecturer == null) {
                throw new Error(`Unknown lecturer ${course.lecturer}`);
            }

            (dbCourse as any).lecturer = newLecturer.id;
        }

        if (course.category) {
            const newCategory = await CourseCategoryModel.findOne({name: course.category}).exec();
            if (newCategory == null) {
                throw new Error(`Unknown category ${course.category}!`);
            }
            (dbCourse as any).category = newCategory._id;
        }

        if (course.description) {
            (dbCourse as any).description = course.description;
        }
        if (course.organiser) {
            (dbCourse as any).organiser = course.organiser;
        }
        if (course.price) {
            (dbCourse as any).price = course.price;
        }
        if (course.title) {
            (dbCourse as any).title = course.title;
        }
        if (course.dates) {
            (dbCourse as any).dates = course.dates;
        }

        return this.convertCourseModelToCourse(await dbCourse.save());
    }

    public async addCourseDate(id: string, date: Omit<CourseDate, 'id'>): Promise<CourseDate | undefined> {
        const dbCourse = await CourseModel.findOne({_id: id}).exec();

        if (dbCourse == null) {
            return;
        }

        if ((dbCourse as any).dates == null) {
            (dbCourse as any).dates = [];
        }
        (date as CourseDate).id = v4();

        (dbCourse as any).dates.push(date);

        await dbCourse.save();
        return date as CourseDate;
    }

    public async deleteCourse(id: string): Promise<Course | undefined> {
        const dbCourse = await CourseModel.findOne({_id: id}).exec();
        if (dbCourse == null) {
            return;
        }

        return this.convertCourseModelToCourse(await dbCourse.deleteOne());
    }

    public async deleteCourseDate(id: string, dateid: string): Promise<CourseDate | undefined> {
        const dbCourse = await CourseModel.findOne({_id: id}).exec();
        if (dbCourse == null) {
            return;
        }

        const dateToDelete = (dbCourse as any as { dates: CourseDate[] }).dates.find(date => date.id === dateid);
        if (dateToDelete == null) {
            return;
        }
        (dbCourse as any as { dates: CourseDate[] }).dates =
            (dbCourse as any as { dates: CourseDate[] }).dates.filter(date => date.id !== dateid);
        await dbCourse.updateOne(dbCourse);

        return dateToDelete;
    }

    public async updateCourseDate(id: string, dateid: string, date: UpdateCourseDate): Promise<CourseDate | undefined> {
        const dbCourse = await CourseModel.findOne({_id: id}).exec();

        if (dbCourse == null) {
            return;
        }

        const dbDate = (dbCourse as unknown as { dates: CourseDate[] }).dates.find(date => date.id === dateid);

        if (dbDate == null) {
            return;
        }

        if (date.totalSpots != null) {
            dbDate.totalSpots = date.totalSpots;
        }

        if (date.endDate != null) {
            dbDate.endDate = date.endDate;
        }

        if (date.startDate != null) {
            dbDate.startDate = date.startDate;
        }

        await dbCourse.updateOne(dbCourse);

        return dbDate;
    }

    private async convertCourseModelToCourse(model: MongooseDocument): Promise<Course | undefined> {
        const el = model as unknown as Course;

        const user = await this.userService.getUserById((model as any).lecturer);
        const category = await CourseCategoryModel.findOne({_id: (model as any).category}).exec();

        if (!user) {
            return;
        }

        return {
            category: ((category as any).name as string || 'N/A') as CourseCategory,
            dates: el.dates,
            description: el.description,
            id: model._id.toString(),
            lecturer: user,
            organiser: el.organiser,
            price: el.price,
            title: el.title
        };
    }
}

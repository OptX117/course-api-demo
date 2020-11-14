import { Course, CourseService } from '../types';

export default class CourseServiceImpl implements CourseService {
    private readonly courses: Course[] = [];

    getAllCourses(): Readonly<Course[]> {
        return Object.freeze(this.courses);
    }

    addCourse(course: Omit<Course, "id">): Course {
        const newCourse = Object.assign({id: this.courses.length}, course);
        this.courses.push(newCourse);
        return newCourse;
    }

}

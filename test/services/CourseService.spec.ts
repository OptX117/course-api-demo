import proxyquire from 'proxyquire';
import chai, { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import CourseServiceImpl from '../../src/services/CourseService';
import { Course, CourseDate, User, UserService } from '../../src/types';
import moment from 'moment';

chai.use(sinonChai);

let service: CourseServiceImpl;
let proxyStubs: Record<string, SinonStub>;
let categoryProxyStubs: Record<string, SinonStub>;

const courses: Course[] = [
    {
        id: 'TEST1',
        title: 'TEST',
        dates: [{
            id: 'TEST',
            startDate: moment().add(10, 'days').add(10, 'hours').toISOString(),
            endDate: moment().add(10, 'days').add(10, 'hours').add(30, 'minutes').toISOString(),
            totalSpots: 10,
            location: 'MARS'
        }, {
            id: 'TEST',
            startDate: moment().add(17, 'days').add(10, 'hours').toISOString(),
            endDate: moment().add(17, 'days').add(10, 'hours').add(30, 'minutes').toISOString(),
            totalSpots: 5,
            location: 'THE MOON'
        }],
        price: 1887,
        description: 'TEST',
        category: 'Sprachkurs',
        lecturer: {
            id: 'TEST',
            isLecturer: true,
            name: 'TEST'
        },
        organiser: 'TEST'
    },
    {
        id: 'TEST2',
        title: 'TEST',
        dates: [{
            id: 'TEST',
            startDate: moment().add(20, 'days').add(10, 'hours').toISOString(),
            endDate: moment().add(20, 'days').add(10, 'hours').add(30, 'minutes').toISOString(),
            totalSpots: 10,
            location: 'MARS'
        }, {
            id: 'TEST',
            startDate: moment().add(27, 'days').add(10, 'hours').toISOString(),
            endDate: moment().add(27, 'days').add(10, 'hours').add(30, 'minutes').toISOString(),
            totalSpots: 5,
            location: 'THE MOON'
        }],
        price: 1887,
        description: 'TEST',
        category: 'Sprachkurs',
        lecturer: {
            id: 'TEST',
            isLecturer: true,
            name: 'TEST'
        },
        organiser: 'TEST'
    },
    {
        id: 'TEST3',
        title: 'TEST',
        dates: [{
            id: 'TEST',
            startDate: moment().add(30, 'days').add(10, 'hours').toISOString(),
            endDate: moment().add(30, 'days').add(10, 'hours').add(30, 'minutes').toISOString(),
            totalSpots: 10,
            location: 'MARS'
        }, {
            id: 'TEST',
            startDate: moment().add(37, 'days').add(10, 'hours').toISOString(),
            endDate: moment().add(37, 'days').add(10, 'hours').add(30, 'minutes').toISOString(),
            totalSpots: 5,
            location: 'THE MOON'
        }],
        price: 1887,
        description: 'TEST',
        category: 'Sprachkurs',
        lecturer: {
            id: 'TEST',
            isLecturer: true,
            name: 'TEST'
        },
        organiser: 'TEST'
    }
];

const dbCourseCategories: any[] = [
    {name: 'Sprachkurs', id: 'COURSECATID'}
];

const courseCategories = dbCourseCategories.map(el => el.name);

const dbCourses = courses.map(course => {
    const ret: any = Object.assign({
        _id: course.id
    }, course);
    ret.lecturer = course.lecturer.id;
    ret.category = dbCourseCategories[0];

    return ret;
});

let userService: UserService;

describe('CourseService', () => {
    beforeEach(() => {
        proxyStubs = {
            findOne: sinon.stub(),
            updateOne: sinon.stub(),
            find: sinon.stub(),
            delete: sinon.stub(),
            deleteOne: sinon.stub(),
            save: sinon.stub()
        };
        categoryProxyStubs = {
            findOne: sinon.stub(),
            find: sinon.stub()
        };


        const CourseServiceProxy = proxyquire.noCallThru()('../../src/services/CourseService', {
            '../models/Course': Object.assign(function () {
                return proxyStubs;
            }, proxyStubs),
            '../models/CourseCategory': categoryProxyStubs
        }).default;

        userService = {
            addUser(username: string, password: string, lecturer: boolean): Promise<User> {
                return Promise.resolve({
                    name: 'TEST',
                    isLecturer: true,
                    id: 'TEST'
                });
            }, getAllUsers(): Promise<User[]> {
                return Promise.resolve([{
                    name: 'TEST',
                    isLecturer: true,
                    id: 'TEST'
                }]);
            }, getUser(username: string): Promise<User | null> {
                return Promise.resolve({
                    name: username,
                    isLecturer: true,
                    id: 'TEST'
                });
            }, getUserById(userId: string): Promise<User | null> {
                return Promise.resolve({
                    name: 'TEST',
                    isLecturer: true,
                    id: userId
                });
            }, isPasswordValid(userOrUsername: User | string, password: string): Promise<boolean> {
                return Promise.resolve(true);
            }

        };

        service = new CourseServiceProxy(userService) as CourseServiceImpl;
    });

    describe('getAllCourses()', () => {
        it('should return all courses if no start or end date are set', async () => {
            proxyStubs.find.returns({
                exec: () => Promise.resolve(dbCourses)
            });
            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });

            expect(await service.getAllCourses()).to.eql(courses);
        });

        it('should return courses from start date if set', async () => {
            proxyStubs.find.returns({
                exec: () => Promise.resolve(dbCourses)
            });
            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });

            expect(await service.getAllCourses(moment().add(19, 'days').toISOString())).to.eql([courses[1], courses[2]]);
        });

        it('should return courses until end date if set', async () => {
            proxyStubs.find.returns({
                exec: () => Promise.resolve(dbCourses)
            });
            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });

            expect(await service.getAllCourses(undefined, moment().add(15, 'days').toISOString())).to.eql([courses[0]]);
        });

        it('should return courses from within interval between start and end date if set', async () => {
            proxyStubs.find.returns({
                exec: () => Promise.resolve(dbCourses)
            });
            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });

            expect(await service.getAllCourses(moment().toISOString(),
                moment().add(27, 'days').toISOString())).to.eql([courses[0], courses[1]]);
        });
    });

    describe('getCourse', () => {
        it('should call findOne on the model with the correct parameters', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourses[0])
            });
            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });

            expect(await service.getCourse('TEST')).to.eql(courses[0]);
            expect(proxyStubs.findOne).to.have.been.calledWith({_id: 'TEST'});
        });
    });

    describe('deleteCourse', () => {
        it('should call delete on the model with the correct parameters', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve(Object.assign(JSON.parse(JSON.stringify(dbCourses[0])), proxyStubs))
            });
            proxyStubs.deleteOne.returns(Promise.resolve(dbCourses[0]));

            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });

            expect(await service.deleteCourse('TEST')).to.eql(courses[0]);
            expect(proxyStubs.findOne).to.have.been.calledWith({_id: 'TEST'});
            expect(proxyStubs.deleteOne).to.have.been.calledOnce;
        });
    });

    describe('getCourseCategories', () => {
        it('should call find on the model', async () => {
            categoryProxyStubs.find.returns({
                exec: () => Promise.resolve(dbCourseCategories)
            });

            expect(await service.getCourseCategories()).to.eql(courseCategories);
            expect(categoryProxyStubs.find).to.have.been.calledOnce;
        });
    });

    describe('updateCourse', () => {
        it('should call save on the model with the correct parameters', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve(Object.assign(JSON.parse(JSON.stringify(dbCourses[0])), proxyStubs))
            });
            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });

            const tests: any[] = [
                {title: 'TEST2'},
                {dates: []},
                {price: 2811, description: 'TEST2123'},
                {organiser: 'MÄÄH'}
            ];

            for (const test of tests) {
                const expected = JSON.parse(JSON.stringify(courses[0]));
                const dbCourse = JSON.parse(JSON.stringify(dbCourses[0]));
                for (const key in test) {
                    // noinspection JSUnfilteredForInLoop
                    expected[key] = test[key];
                    // noinspection JSUnfilteredForInLoop
                    dbCourse[key] = test[key];
                }
                proxyStubs.save.returns(Promise.resolve(dbCourse));

                expect(await service.updateCourse('TEST', test)).to.eql(expected);
                expect(proxyStubs.findOne).to.have.been.calledWith({_id: 'TEST'});
                proxyStubs.save.reset();
            }

        });
    });

    describe('addCourse', () => {
        it('should set the right parameters on the model and call save', async () => {
            proxyStubs.save.returns(Promise.resolve(dbCourses[0]));
            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });
            const update = JSON.parse(JSON.stringify(dbCourses[0]));
            delete update._id;
            expect(await service.addCourse(update)).to.eql(courses[0]);
            expect(proxyStubs.save).to.have.been.calledOnce;
        });
    });

    describe('addCourseDate', () => {
        it('should set the right parameters on the model and call save', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve(Object.assign(JSON.parse(JSON.stringify(dbCourses[0])), proxyStubs))
            });
            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });

            const test: CourseDate =
                {
                    startDate: moment().toISOString(),
                    endDate: moment().toISOString(),
                    location: 'HERE',
                    id: '1234',
                    totalSpots: 10
                };


            const expected = JSON.parse(JSON.stringify(courses[0]));
            const dbCourse = JSON.parse(JSON.stringify(dbCourses[0]));

            expected.dates.push(test);
            dbCourse.dates.push(test);


            proxyStubs.save.returns(Promise.resolve(dbCourse));

            expect(await service.addCourseDate('TEST', test)).to.eql(test);
            expect(proxyStubs.findOne).to.have.been.calledWith({_id: 'TEST'});
            proxyStubs.save.reset();
        });
    });

    describe('updateCourseDate', () => {
        it('should call update on the model with the correct parameters', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve(Object.assign(JSON.parse(JSON.stringify(dbCourses[0])), proxyStubs))
            });


            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });


            const expected = JSON.parse(JSON.stringify(courses[0]));
            const dbCourse = JSON.parse(JSON.stringify(dbCourses[0]));

            expected.dates[0].location = dbCourse.dates[0].location = 'ASDASDAS';

            proxyStubs.updateOne.returns({
                exec: () => Promise.resolve(dbCourse)
            });

            expect(await service.updateCourseDate('TEST',
                expected.dates[0].id,
                expected.dates[0])).to.eql(expected.dates[0]);
            expect(proxyStubs.findOne).to.have.been.calledWith({_id: 'TEST'});
            expect(proxyStubs.updateOne).to.have.been.calledOnce;
        });
    });

    describe('deleteCourseDate', () => {
        it('should call delete on the model', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve(Object.assign(JSON.parse(JSON.stringify(dbCourses[0])), proxyStubs))
            });


            categoryProxyStubs.findOne.returns({
                exec: () => Promise.resolve(dbCourseCategories[0])
            });


            const expected = JSON.parse(JSON.stringify(courses[0]));
            const dbCourse = JSON.parse(JSON.stringify(dbCourses[0]));


            proxyStubs.updateOne.returns({
                exec: () => Promise.resolve(dbCourse)
            });

            expect(await service.deleteCourseDate('TEST','TEST')).to.eql(expected.dates[0]);
            expect(proxyStubs.findOne).to.have.been.calledWith({_id: 'TEST'});
            expect(proxyStubs.updateOne).to.have.been.calledOnce;

        });
    });
});






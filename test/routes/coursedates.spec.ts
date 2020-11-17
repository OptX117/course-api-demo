import common from './common';
import { Course, CourseCategory, UpdateCourseDate, User } from '../../src/types';
import { Express } from 'express';

const {chai, getApp, disconnectDB, getDBEntries, setupDB, doLogin} = common;
const {expect} = chai;

let app: Express;
let users: Record<string, User>;
let courses: Record<string, Course>;
let courseCategories: CourseCategory[];

describe('/courses/:id/dates', () => {
    before(async () => {
        app = await getApp();
    });

    after(disconnectDB);

    beforeEach(async () => {
        await setupDB();
        const dbEntries = await getDBEntries();
        users = dbEntries.users;
        courses = dbEntries.courses;
        courseCategories = dbEntries.courseCategories;
    });

    describe('GET', () => {
        it('should return all course dates for the specific course', () => {
            return chai.request(app)
                .get('/courses/' + courses['TEST'].id + '/dates')
                .send()
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const body = res.body;
                    expect(body).to.eql(courses['TEST'].dates);
                });
        });
    });

    describe('POST', () => {
        it('should return status 200 and the new course date if login cookie is set', () => {
            const courseDateInput: UpdateCourseDate = {
                startDate: '2020-11-28T18:00:00+01:00',
                endDate: '2020-11-28T20:00:00+01:00',
                totalSpots: 7,
                location: 'THE MOON'
            };

            return chai.request(app)
                .post('/courses/' + courses['TEST'].id + '/dates')
                .send(courseDateInput)
                .set('Cookie',
                    'jsession=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    const body = res.body;
                    const {id} = body;
                    delete body.id;
                    expect(body).to.eql(courseDateInput);
                    expect(id).to.not.be.undefined;
                });
        });

        it('should return status 200 and the new course date if login header is set', () => {
            const courseDateInput: UpdateCourseDate = {
                startDate: '2020-11-28T18:00:00+01:00',
                endDate: '2020-11-28T20:00:00+01:00',
                totalSpots: 7,
                location: 'DOWN'
            };

            return chai.request(app)
                .post('/courses/' + courses['TEST'].id + '/dates')
                .send(courseDateInput)
                .set('Authorization',
                    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    const body = res.body;
                    const {id} = body;
                    delete body.id;
                    expect(body).to.eql(courseDateInput);
                    expect(id).to.not.be.undefined;

                });
        });

        it('should return status 200 and the new course date should be found in GET request', () => {
            const courseDateInput: UpdateCourseDate = {
                startDate: '2020-11-28T18:00:00+01:00',
                endDate: '2020-11-28T20:00:00+01:00',
                totalSpots: 7,
                location: 'MARS'
            };

            const agent = chai.request.agent(app);
            return agent
                .post('/courses/' + courses['TEST'].id + '/dates')
                .send(courseDateInput)
                .set('Cookie',
                    'jsession=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    const body = res.body;
                    const {id} = body;
                    delete body.id;
                    expect(body).to.eql(courseDateInput);
                    expect(id).to.not.be.undefined;

                    return agent.get('/courses/' + courses['TEST'].id + '/dates')
                        .send()
                        .then(res => {
                            expect(res).to.have.status(200);
                            expect(res).to.be.json;
                            const body = res.body.map((v: any) => {
                                delete (v as any).id;
                                return v;
                            });
                            expect(body).to.eql([...courses['TEST'].dates, courseDateInput].map(v => {
                                delete (v as any).id;
                                return v;
                            }));
                        });
                }).finally(() => agent.close());
        });
    });

    describe('/:id', () => {
        describe('GET', () => {
            it('should return status 200 and a course if found', () => {
                return chai.request(app)
                    .get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                    .send()
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        const body = res.body;
                        expect(body).to.eql(courses['TEST'].dates[0]);
                    });
            });

            it('should return status 404 and no course if none found', () => {
                return chai.request(app)
                    .get(`/courses/NOPE`)
                    .send()
                    .then(res => {
                        expect(res).to.have.status(404);
                        expect(res).to.not.be.json;

                        const body = res.body;
                        expect(body).to.eql({});
                    });
            });
        });

        describe('PUT', () => {
            it('should return status 200 and change the information if user is authorized', () => {
                const courseDateInput = {
                    totalSpots: 8
                };

                const courseDateInputReturn = Object.assign(courses['TEST'].dates[0], {
                    totalSpots: 8
                });

                const agent = chai.request.agent(app);

                return doLogin(agent, true)
                    .then(user => {
                        return agent
                            .put(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                            .send(courseDateInput)
                            .set('Authorization',
                                'Bearer ' + user.token)
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;
                                const body = res.body;
                                expect(body).to.eql(courseDateInputReturn);

                                return agent.get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                                    .send()
                                    .then(res => {
                                        expect(res).to.have.status(200);
                                        expect(res).to.be.json;

                                        const body = res.body;
                                        expect(body).to.eql(courseDateInputReturn);
                                    });
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 400 and not change the information if user is authorized, but input is malformed',
                () => {
                    const courseInput = {
                        'NOPE': 'NOPE'
                    };

                    const agent = chai.request.agent(app);

                    return doLogin(agent, true)
                        .then(user => {
                            return agent
                                .put(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                                .send(courseInput)
                                .set('Authorization',
                                    'Bearer ' + user.token)
                                .then(res => {
                                    expect(res).to.have.status(400);
                                    expect(res).to.not.be.json;
                                    const body = res.body;
                                    expect(body).to.eql({});

                                    return agent.get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                                        .send()
                                        .then(res => {
                                            expect(res).to.have.status(200);
                                            expect(res).to.be.json;

                                            const body = res.body;
                                            expect(body).to.eql(courses['TEST'].dates[0]);
                                        });

                                });
                        }).finally(() => agent.close());
                });

            it('should return status 403 and not change the information if user is not authorized', () => {
                const courseDateInput = {
                    totalSpots: 8
                };

                const agent = chai.request.agent(app);

                return agent
                    .put(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                    .send(courseDateInput)
                    .then(res => {
                        expect(res).to.have.status(403);
                        expect(res).to.not.be.json;
                        const body = res.body;
                        expect(body).to.eql({});

                        return agent.get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                            .send()
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;

                                const body = res.body;
                                expect(body).to.eql(courses['TEST'].dates[0]);
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 403 and not change the information if user is not the lecturer of a course',
                () => {
                    const courseDateInput = {
                        totalSpots: 8
                    };

                    const agent = chai.request.agent(app);

                    return agent.post('/users/login')
                        .send({
                            'username': '003',
                            'password': '003'
                        }).then(res => res.body.token)
                        .then(token => {
                            return agent
                                .put(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                                .send(courseDateInput)
                                .set('Authorization',
                                    'Bearer ' + token)
                                .then(res => {
                                    expect(res).to.have.status(403);
                                    expect(res).to.not.be.json;
                                    const body = res.body;
                                    expect(body).to.eql({});

                                    return agent.get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                                        .send()
                                        .then(res => {
                                            expect(res).to.have.status(200);
                                            expect(res).to.be.json;

                                            const body = res.body;
                                            expect(body).to.eql(courses['TEST'].dates[0]);
                                        });
                                });
                        }).finally(() => agent.close());
                });
        });

        describe('DELETE', () => {
            it('should return status 200 and delete the course date if user is authorized', () => {
                const agent = chai.request.agent(app);

                return doLogin(agent, true)
                    .then(user => {
                        return agent
                            .delete(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                            .set('Authorization',
                                'Bearer ' + user.token)
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;
                                const body = res.body;
                                expect(body).to.eql(courses['TEST'].dates[0]);

                                return agent.get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                                    .send()
                                    .then(res => {
                                        expect(res).to.have.status(404);
                                        expect(res).to.not.be.json;

                                        const body = res.body;
                                        expect(body).to.eql({});
                                    });
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 403 and not delete the course date if user is not authorized', () => {
                const agent = chai.request.agent(app);

                return agent
                    .delete(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                    .then(res => {
                        expect(res).to.have.status(403);
                        expect(res).to.not.be.json;
                        const body = res.body;
                        expect(body).to.eql({});

                        return agent.get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                            .send()
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;

                                const body = res.body;
                                expect(body).to.eql(courses['TEST'].dates[0]);
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 403 and not delete the course date if user is not the lecturer of a course',
                () => {
                    const agent = chai.request.agent(app);

                    return agent.post('/users/login')
                        .send({
                            'username': '003',
                            'password': '003'
                        }).then(res => res.body.token)
                        .then(token => {
                            return agent
                                .delete(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                                .set('Authorization',
                                    'Bearer ' + token)
                                .then(res => {
                                    expect(res).to.have.status(403);
                                    expect(res).to.not.be.json;
                                    const body = res.body;
                                    expect(body).to.eql({});

                                    return agent.get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}`)
                                        .send()
                                        .then(res => {
                                            expect(res).to.have.status(200);
                                            expect(res).to.be.json;

                                            const body = res.body;
                                            expect(body).to.eql(courses['TEST'].dates[0]);
                                        });
                                });
                        }).finally(() => agent.close());
                });
        });
    });
});

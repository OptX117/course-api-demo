import common from './common';
import { Course, CourseCategory, User } from '../../src/types';
import { Express } from 'express';
import moment from 'moment';

const {chai, getApp, disconnectDB, getDBEntries, setupDB, doLogin} = common;
const {expect} = chai;

let app: Express;
let users: Record<string, User>;
let courses: Record<string, Course>;
let courseCategories: CourseCategory[];

describe('/courses', () => {
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
        it('should return all courses', () => {
            return chai.request(app)
                .get('/courses')
                .send()
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const body = res.body;
                    expect(body).to.eql(Object.values(courses));
                });
        });

        it('should return courses before end date if specified', () => {
            return chai.request(app)
                .get(`/courses?end=${courses['TEST'].dates[0].endDate}`)
                .send()
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const body = res.body;
                    expect(body).to.eql(Object.values(courses));
                });
        });

        it('should not return courses after end date if specified', () => {
            return chai.request(app)
                .get(`/courses?end=${moment(courses['TEST'].dates[0].endDate).subtract(10, 'hour').toISOString()}`)
                .send()
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const body = res.body;
                    expect(body).to.eql([]);
                });
        });

        it('should not return courses before start date if specified', () => {
            return chai.request(app)
                .get(`/courses?start=${moment(courses['TEST'].dates[0].startDate).add(10, 'hours')}`)
                .send()
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const body = res.body;
                    expect(body).to.eql([]);
                });
        });

        it('should return courses after start date if specified', () => {
            return chai.request(app)
                .get(`/courses?start=${courses['TEST'].dates[0].startDate}`)
                .send()
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const body = res.body;
                    expect(body).to.eql(Object.values(courses));
                });
        });

        it('should return courses in interval between start and end date if specified', () => {
            return chai.request(app)
                .get(`/courses?start=${courses['TEST'].dates[0].startDate}&end=${courses['TEST'].dates[0].endDate}`)
                .send()
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const body = res.body;
                    expect(body).to.eql(Object.values(courses));
                });
        });

        it('should not return courses outside of interval between start and end date if specified', () => {
            return chai.request(app)
                .get(`/courses?start=${moment(courses['TEST'].dates[0].startDate).add(10, 'hours').toISOString()}&end=${moment(courses['TEST'].dates[0].endDate).add(10, 'hours').toISOString()}`)
                .send()
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;

                    const body = res.body;
                    expect(body).to.eql([]);
                });
        });
    });

    describe('POST', () => {
        it('should return status 200 and the new course if login cookie is set', () => {
            const courseInput = {
                'title': '2. Test',
                'description': 'Woooo',
                'lecturer': '002',
                'price': 1887,
                'dates': [],
                'category': 'Sprachkurs',
                'organiser': 'ICH'
            };

            const courseInputReturn = {
                'title': '2. Test',
                'description': 'Woooo',
                'lecturer': users['002'],
                'price': 1887,
                'dates': [],
                'category': 'Sprachkurs',
                'organiser': 'ICH'
            };

            return chai.request(app)
                .post('/courses')
                .send(courseInput)
                .set('Cookie',
                    'jsession=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    const body = res.body;
                    const {id} = body;
                    delete body.id;
                    expect(body).to.eql(courseInputReturn);
                    expect(id).to.not.be.undefined;
                });
        });

        it('should return status 200 and the new course if login header is set', () => {
            const courseInput = {
                'title': '2. Test',
                'description': 'Woooo',
                'lecturer': '002',
                'price': 1887,
                'dates': [],
                'category': 'Sprachkurs',
                'organiser': 'ICH'
            };

            const courseInputReturn = {
                'title': '2. Test',
                'description': 'Woooo',
                'lecturer': users['002'],
                'price': 1887,
                'dates': [],
                'category': 'Sprachkurs',
                'organiser': 'ICH'
            };

            return chai.request(app)
                .post('/courses')
                .send(courseInput)
                .set('Authorization',
                    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    const body = res.body;
                    const {id} = body;
                    delete body.id;
                    expect(body).to.eql(courseInputReturn);
                    expect(id).to.not.be.undefined;
                });
        });

        it('should return status 200 and the new course should be found in GET request', () => {
            const courseInput = {
                'title': '2. Test',
                'description': 'Woooo',
                'lecturer': '002',
                'price': 1887,
                'dates': [],
                'category': 'Sprachkurs',
                'organiser': 'ICH'
            };

            const courseInputReturn = {
                'title': '2. Test',
                'description': 'Woooo',
                'lecturer': users['002'],
                'price': 1887,
                'dates': [],
                'category': 'Sprachkurs',
                'organiser': 'ICH'
            };

            const agent = chai.request.agent(app);
            return agent
                .post('/courses')
                .send(courseInput)
                .set('Cookie',
                    'jsession=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    const body = res.body;
                    const {id} = body;
                    delete body.id;
                    expect(body).to.eql(courseInputReturn);
                    expect(id).to.not.be.undefined;

                    return agent.get('/courses')
                        .send()
                        .then(res => {
                            expect(res).to.have.status(200);
                            expect(res).to.be.json;
                            const body = res.body.map((v: any) => {
                                delete (v as any).id;
                                return v;
                            });
                            expect(body).to.eql([...Object.values(courses), courseInputReturn].map(v => {
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
                    .get(`/courses/${courses['TEST'].id}`)
                    .send()
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;

                        const body = res.body;
                        expect(body).to.eql(courses['TEST']);
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
                const courseInput = {
                    'title': '2. Test'
                };

                const courseInputReturn = Object.assign(courses['TEST'], {
                    title: '2. Test'
                });

                const agent = chai.request.agent(app);

                return doLogin(agent, true)
                    .then(user => {
                        return agent
                            .put('/courses/' + courses['TEST'].id)
                            .send(courseInput)
                            .set('Authorization',
                                'Bearer ' + user.token)
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;
                                const body = res.body;
                                expect(body).to.eql(courseInputReturn);

                                return agent.get('/courses/' + courses['TEST'].id)
                                    .send()
                                    .then(res => {
                                        expect(res).to.have.status(200);
                                        expect(res).to.be.json;

                                        const body = res.body;
                                        expect(body).to.eql(courseInputReturn);
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
                                .put('/courses/' + courses['TEST'].id)
                                .send(courseInput)
                                .set('Authorization',
                                    'Bearer ' + user.token)
                                .then(res => {
                                    expect(res).to.have.status(400);
                                    expect(res).to.not.be.json;
                                    const body = res.body;
                                    expect(body).to.eql({});

                                    return agent.get('/courses/' + courses['TEST'].id)
                                        .send()
                                        .then(res => {
                                            expect(res).to.have.status(200);
                                            expect(res).to.be.json;

                                            const body = res.body;
                                            expect(body).to.eql(courses['TEST']);
                                        });

                                });
                        }).finally(() => agent.close());
                });

            it('should return status 403 and not change the information if user is not authorized', () => {
                const courseInput = {
                    'title': '2. Test'
                };

                const agent = chai.request.agent(app);

                return agent
                    .put('/courses/' + courses['TEST'].id)
                    .send(courseInput)
                    .then(res => {
                        expect(res).to.have.status(403);
                        expect(res).to.not.be.json;
                        const body = res.body;
                        expect(body).to.eql({});

                        return agent.get('/courses/' + courses['TEST'].id)
                            .send()
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;

                                const body = res.body;
                                expect(body).to.eql(courses['TEST']);
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 403 and not change the information if user is not the lecturer of a course',
                () => {
                    const courseInput = {
                        'title': '2. Test'
                    };

                    const agent = chai.request.agent(app);

                    return agent.post('/users/login')
                        .send({
                            'username': '003',
                            'password': '003'
                        }).then(res => res.body.token)
                        .then(token => {
                            return agent
                                .put('/courses/' + courses['TEST'].id)
                                .send(courseInput)
                                .set('Authorization',
                                    'Bearer ' + token)
                                .then(res => {
                                    expect(res).to.have.status(403);
                                    expect(res).to.not.be.json;
                                    const body = res.body;
                                    expect(body).to.eql({});

                                    return agent.get('/courses/' + courses['TEST'].id)
                                        .send()
                                        .then(res => {
                                            expect(res).to.have.status(200);
                                            expect(res).to.be.json;

                                            const body = res.body;
                                            expect(body).to.eql(courses['TEST']);
                                        });
                                });
                        }).finally(() => agent.close());
                });
        });

        describe('DELETE', () => {
            it('should return status 200 and delete the course if user is authorized', () => {
                const agent = chai.request.agent(app);

                return doLogin(agent, true)
                    .then(user => {
                        return agent
                            .delete('/courses/' + courses['TEST'].id)
                            .set('Authorization',
                                'Bearer ' + user.token)
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;
                                const body = res.body;
                                expect(body).to.eql(courses['TEST']);

                                return agent.get('/courses/' + courses['TEST'].id)
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

            it('should return status 403 and not delete the course if user is not authorized', () => {
                const agent = chai.request.agent(app);

                return agent
                    .delete('/courses/' + courses['TEST'].id)
                    .then(res => {
                        expect(res).to.have.status(403);
                        expect(res).to.not.be.json;
                        const body = res.body;
                        expect(body).to.eql({});

                        return agent.get('/courses/' + courses['TEST'].id)
                            .send()
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;

                                const body = res.body;
                                expect(body).to.eql(courses['TEST']);
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 403 and not delete the course if user is not the lecturer of a course',
                () => {
                    const agent = chai.request.agent(app);

                    return agent.post('/users/login')
                        .send({
                            'username': '003',
                            'password': '003'
                        }).then(res => res.body.token)
                        .then(token => {
                            return agent
                                .delete('/courses/' + courses['TEST'].id)
                                .set('Authorization',
                                    'Bearer ' + token)
                                .then(res => {
                                    expect(res).to.have.status(403);
                                    expect(res).to.not.be.json;
                                    const body = res.body;
                                    expect(body).to.eql({});

                                    return agent.get('/courses/' + courses['TEST'].id)
                                        .send()
                                        .then(res => {
                                            expect(res).to.have.status(200);
                                            expect(res).to.be.json;

                                            const body = res.body;
                                            expect(body).to.eql(courses['TEST']);
                                        });
                                });
                        }).finally(() => agent.close());
                });

        });
    });
});

import common from './common';
import { Course, CourseDateBooking, CourseDateBookingUpdate, User } from '../../src/types';
import { Express } from 'express';

const {chai, getApp, disconnectDB, getDBEntries, setupDB, doLogin} = common;
const {expect} = chai;

let app: Express;
let users: Record<string, User>;
let courses: Record<string, Course>;
let bookings: CourseDateBooking[];

describe('/courses/:id/dates/:id/bookings', () => {
    before(async () => {
        app = await getApp();
    });

    after(disconnectDB);

    beforeEach(async () => {
        await setupDB();
        const dbEntries = await getDBEntries();
        users = dbEntries.users;
        courses = dbEntries.courses;
        bookings = dbEntries.bookings;
    });

    describe('GET', () => {
        it('should return status code 200 and all course dates for the specific course and user if logged in', () => {
            const agent = chai.request.agent(app);
            return doLogin(agent, false).then(user => {
                return chai.request(app)
                    .get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}/bookings`)
                    .send()
                    .set('Cookie',
                        `jsession=${user.token}`)
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;

                        const body = res.body;
                        expect(body).to.eql(bookings.filter(el => el.user === user.id));
                    });
            }).finally(() => agent.close());
        });

        it('should return status code 200 and all course bookings for the lecturer of the course', () => {
            const agent = chai.request.agent(app);
            return doLogin(agent, true).then(user => {
                return chai.request(app)
                    .get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}/bookings`)
                    .send()
                    .set('Cookie',
                        `jsession=${user.token}`)
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;

                        const body = res.body;
                        expect(body).to.eql(bookings.filter(el => el.course === courses['TEST'].id));
                    });
            }).finally(() => agent.close());
        });

        it('should return status code 403 and no bookings if user is not authorized', () => {
            return chai.request(app)
                .get(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}/bookings`)
                .send()
                .then(res => {
                    expect(res).to.have.status(403);
                    expect(res).to.not.be.json;

                    const body = res.body;
                    expect(body).to.eql({});
                });
        });
    });

    describe('POST', () => {
        it('should return status 200 and the new course date if login cookie is set', () => {
            const bookingInput: CourseDateBookingUpdate = {
                spots: 1
            };

            const agent = chai.request.agent(app);
            return doLogin(agent, false).then(user => {
                return agent
                    .post(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}/bookings`)
                    .send(bookingInput)
                    .set('Cookie',
                        'jsession=' + user.token)
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        const body = res.body;
                        const {id} = body;
                        delete body.id;
                        expect(body).to.eql({
                            course: courses['TEST'].id,
                            spots: 1,
                            date: courses['TEST'].dates[0].id,
                            user: user.id
                        });
                        expect(id).to.not.be.undefined;
                    }).finally(() => agent.close());
            });
        });

        it('should return status 200 and the new course date if login header is set', () => {
            const bookingInput: CourseDateBookingUpdate = {
                spots: 1
            };


            const agent = chai.request.agent(app);
            return doLogin(agent, false).then(user => {
                return agent
                    .post(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}/bookings`)
                    .send(bookingInput)
                    .set('Authorization',
                        'Bearer ' + user.token)
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        const body = res.body;
                        const {id} = body;
                        delete body.id;
                        expect(body).to.eql({
                            course: courses['TEST'].id,
                            date: courses['TEST'].dates[0].id,
                            spots: 1,
                            user: user.id
                        });

                        expect(id).to.not.be.undefined;
                    });
            }).finally(() => agent.close());
        });

        it('should return status 200 and the new course date should be found in GET request', () => {
            const bookingInput: CourseDateBookingUpdate = {
                spots: 1
            };

            const agent = chai.request.agent(app);
            return doLogin(agent, false).then(user => {
                return agent
                    .post(`/courses/${courses['TEST'].id}/dates/${courses['TEST'].dates[0].id}/bookings`)
                    .send(bookingInput)
                    .set('Cookie',
                        'jsession=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        const body = res.body;
                        const {id} = body;
                        delete body.id;
                        expect(body).to.eql({
                            course: courses['TEST'].id,
                            spots: 1,
                            date: courses['TEST'].dates[0].id,
                            user: user.id
                        });
                        expect(id).to.not.be.undefined;

                        return agent.get('/courses/' + courses['TEST'].id + '/dates/' + courses['TEST'].dates[0].id +
                                         '/bookings')
                            .send()
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;
                                const body = res.body.map((v: any) => {
                                    delete (v as any).id;
                                    return v;
                                });
                                expect(body).to.eql([...bookings.filter(b => b.course === courses['TEST'].id &&
                                                                             b.user ===
                                                                             user.id), {
                                    course: courses['TEST'].id,
                                    spots: 1,
                                    date: courses['TEST'].dates[0].id,
                                    user: user.id
                                }].map(v => {
                                    delete (v as any).id;
                                    return v;
                                }));
                            });
                    });
            }).finally(() => agent.close());
        });
    });

    describe('/:id', () => {
        describe('GET', () => {
            it('should return status 200 and a course if found', () => {
                const course = courses['TEST'];
                const agent = chai.request.agent(app);
                return doLogin(agent, false)
                    .then(user => {
                        const booking = bookings.find(
                            el => el.course === course.id && el.user == user.id) as CourseDateBooking;
                        return agent
                            .get(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
                            .set('Authorization',
                                'Bearer ' + user.token)
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;
                                const body = res.body;
                                expect(body).to.eql(booking);
                            });
                    }).finally(() => agent.close());

            });

            it('should return status 404 and no course if none found', () => {
                const course = courses['TEST'];
                const agent = chai.request.agent(app);
                return doLogin(agent, false)
                    .then(user => {
                        return agent
                            .get(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/NOPE`)
                            .set('Authorization',
                                'Bearer ' + user.token)
                            .then(res => {
                                expect(res).to.have.status(404);
                                expect(res).to.not.be.json;
                                const body = res.body;
                                expect(body).to.eql({});
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 403 and no course if user is not authorized', () => {
                const course = courses['TEST'];
                return chai.request(app)
                    .get(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/NOPE`)
                    .then(res => {
                        expect(res).to.have.status(403);
                        expect(res).to.not.be.json;
                        const body = res.body;
                        expect(body).to.eql({});
                    });
            });
        });

        describe('PUT', () => {
            it('should return status 200 and change the information if user is authorized', () => {
                const course = courses['TEST'];
                const booking = bookings.find(el => el.date === course.dates[0].id &&
                                                    el.user === users['001'].id && el.course ===
                                                    course.id) as CourseDateBooking;

                const bookingInput = {
                    spots: 1
                };

                const bookingReturn = Object.assign(booking, {
                    spots: 1
                });

                const agent = chai.request.agent(app);
                return doLogin(agent, false)
                    .then(user => {
                        return agent
                            .put(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
                            .send(bookingInput)
                            .set('Authorization',
                                'Bearer ' + user.token)
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;
                                const body = res.body;
                                expect(body).to.eql(bookingReturn);

                                return agent.get(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
                                    .send()
                                    .then(res => {
                                        expect(res).to.have.status(200);
                                        expect(res).to.be.json;

                                        const body = res.body;
                                        expect(body).to.eql(bookingReturn);
                                    });
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 400 and not change the information if user is authorized, but input is malformed',
                () => {
                    const course = courses['TEST'];
                    const booking = bookings.find(el => el.date === course.dates[0].id &&
                                                        el.user === users['001'].id && el.course ===
                                                        course.id) as CourseDateBooking;
                    const bookingInput = {
                        'NOPE': 'NOPE'
                    };

                    const agent = chai.request.agent(app);

                    return doLogin(agent, true)
                        .then(user => {
                            return agent
                                .put(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
                                .send(bookingInput)
                                .set('Authorization',
                                    'Bearer ' + user.token)
                                .then(res => {
                                    expect(res).to.have.status(400);
                                    expect(res).to.not.be.json;
                                    const body = res.body;
                                    expect(body).to.eql({});

                                    return agent.get(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
                                        .send()
                                        .set('Authorization',
                                            'Bearer ' + user.token)
                                        .then(res => {
                                            expect(res).to.have.status(200);
                                            expect(res).to.be.json;

                                            const body = res.body;
                                            expect(body).to.eql(booking);
                                        });

                                });
                        }).finally(() => agent.close());
                });

            it('should return status 403 and not change the information if user is not authorized', () => {
                const course = courses['TEST'];
                const booking = bookings.find(el => el.date === course.dates[0].id &&
                                                    el.user === users['001'].id && el.course ===
                                                    course.id) as CourseDateBooking;
                const bookingInput = {
                    spots: 1
                };

                const agent = chai.request.agent(app);

                return agent
                    .put(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
                    .send(bookingInput)
                    .then(res => {
                        expect(res).to.have.status(403);
                        expect(res).to.not.be.json;
                        const body = res.body;
                        expect(body).to.eql({});

                        return doLogin(agent, true).then(user =>
                            agent.get(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
                                .send()
                                .set('Authorization',
                                    'Bearer ' + user.token)
                                .then(res => {
                                    expect(res).to.have.status(200);
                                    expect(res).to.be.json;

                                    const body = res.body;
                                    expect(body).to.eql(booking);
                                })
                        );
                    }).finally(() => agent.close());
            });
        });

        describe('DELETE', () => {
            it('should return status 200 and delete the booking if user is authorized', () => {
                const agent = chai.request.agent(app);
                const course = courses['TEST'];

                return doLogin(agent, false)
                    .then(user => {
                        const booking = bookings.find(
                            el => el.course === course.id && el.user == user.id && el.date ===
                                  course.dates[0].id) as CourseDateBooking;

                        return agent
                            .delete(`/courses/${course.id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
                            .set('Authorization',
                                'Bearer ' + user.token)
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;
                                const body = res.body;
                                expect(body).to.eql(booking);

                                return agent.get(`/courses/${courses['TEST'].id}/dates/${course.dates[0].id}/bookings/${booking.id}`)
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
                const course = courses['TEST'];
                const booking = bookings.find(
                    el => el.course === course.id && el.user == users['003'].id && el.date ===
                          course.dates[1].id) as CourseDateBooking;
                return agent
                    .delete(`/courses/${course.id}/dates/${course.dates[1].id}/bookings/${booking.id}`)
                    .then(res => {
                        expect(res).to.have.status(403);
                        expect(res).to.not.be.json;
                        const body = res.body;
                        expect(body).to.eql({});

                        return doLogin(agent).then(user =>
                            agent.get(`/courses/${course.id}/dates/${course.dates[1].id}/bookings/${booking.id}`)
                                .send()
                                .set('Authorization',
                                    'Bearer ' + user.token)
                                .then(res => {
                                    expect(res).to.have.status(200);
                                    expect(res).to.be.json;

                                    const body = res.body;
                                    expect(body).to.eql(booking);
                                })
                        );
                    }).finally(() => agent.close());
            });

            it('should return status 403 and not delete the course date if user is not the lecturer of a course',
                () => {
                    const agent = chai.request.agent(app);
                    const course = courses['TEST'];
                    const booking = bookings.find(
                        el => el.course === course.id && el.user == users['003'].id && el.date ===
                              course.dates[1].id) as CourseDateBooking;

                    return agent.post('/users/login')
                        .send({
                            'username': '001',
                            'password': '001'
                        }).then(res => res.body)
                        .then(user => {
                            return agent
                                .delete(`/courses/${course.id}/dates/${course.dates[1].id}/bookings/${booking.id}`)
                                .set('Authorization',
                                    'Bearer ' + user.token)
                                .then(res => {
                                    expect(res).to.have.status(403);
                                    expect(res).to.not.be.json;
                                    const body = res.body;
                                    expect(body).to.eql({});

                                    return doLogin(agent).then(user =>
                                        agent.get(`/courses/${course.id}/dates/${course.dates[1].id}/bookings/${booking.id}`)
                                            .send()
                                            .set('Authorization',
                                                'Bearer ' + user.token)
                                            .then(res => {
                                                expect(res).to.have.status(200);
                                                expect(res).to.be.json;

                                                const body = res.body;
                                                expect(body).to.eql(booking);
                                            })
                                    );
                                });
                        }).finally(() => agent.close());
                });
        });
    });
});

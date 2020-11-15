import common from './common';
import { User } from '../../src/types';
import { Express } from 'express';

const {chai, getApp, disconnectDB, getDBEntries, setupDB} = common;
const {expect} = chai;

let app: Express;
let users: Record<string, User>;

describe('/users', () => {
    before(async () => {
        app = await getApp();
    });

    after(disconnectDB);

    beforeEach(async () => {
        await setupDB();
        const dbEntries = await getDBEntries();
        users = dbEntries.users;
    });

    describe('/me', () => {
        describe('GET', () => {
            it('should return a user if logged in via cookie', () => {
                return chai.request(app)
                    .get('/users/me')
                    .send()
                    .set('Cookie',
                        'jsession=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;

                        const body = res.body;
                        expect(body).to.eql(users['002']);
                    });
            });
            it('should return a user if logged in via authentication header', () => {
                return chai.request(app)
                    .get('/users/me')
                    .send()
                    .set('Authorization',
                        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiMDAyIiwibGVjdHVyZXIiOnRydWUsImlhdCI6MTYwNTQ0MzM0NSwiaXNzIjoiQ291cnNlRGVtb0FwcCIsInN1YiI6IjVmYjExZjA3ZmYxNGFmMjg5MjZiMjA1NiJ9.oVYK8VapcACn7i8AfvP5zdheXEcrSM2BFEIOT902JiM')
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;

                        const body = res.body;
                        expect(body).to.eql(users['002']);
                    });
            });
            it('should not return a user if no token present in either cookie or header', () => {
                return chai.request(app)
                    .get('/users/me')
                    .send()
                    .then(res => {
                        expect(res).to.have.status(403);
                        expect(res).to.not.be.json;
                        expect(res.body).to.be.eql({});
                    });
            });

            it('should not return a user if token is invalid', () => {
                return chai.request(app)
                    .get('/users/me')
                    .send()
                    .set('Authorization', 'Bearer NOPE')
                    .then(res => {
                        expect(res).to.have.status(400);
                        expect(res).to.not.be.json;
                        expect(res.body).to.be.eql({});
                    });
            });
        });
    });

    describe('/login', () => {
        describe('POST', () => {
            it('should return status 200 and the correct user and a token if username and password are correct', () => {
                return chai.request(app)
                    .post('/users/login')
                    .send({
                        username: '002',
                        password: '002'
                    })
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        const body = res.body;
                        const {token} = body;
                        delete body.token;
                        expect(body).to.eql(users['002']);
                        expect(token).to.not.be.undefined;
                    });
            });

            it('should return status 200 and a working token if username and password are correct', () => {
                const agent = chai.request.agent(app);
                return agent
                    .post('/users/login')
                    .send({
                        username: '002',
                        password: '002'
                    })
                    .then(res => {
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        const body = res.body;
                        const {token} = body;
                        delete body.token;
                        expect(token).to.not.be.undefined;

                        return agent.get('/users/me')
                            .send()
                            .set('Authorization',
                                `Bearer ${token}`)
                            .then(res => {
                                expect(res).to.have.status(200);
                                expect(res).to.be.json;

                                const body = res.body;
                                expect(body).to.eql(users['002']);
                            });
                    }).finally(() => agent.close());
            });

            it('should return status 401 and not return a user if username or password are wrong', () => {
                return chai.request(app)
                    .post('/users/login')
                    .send({
                        username: '002',
                        password: '001'
                    })
                    .then(res => {
                        expect(res).to.have.status(401);
                        expect(res).to.not.be.json;
                        expect(res.body).to.eql({});
                    });
            });

            it('should return status 400 and not return a user if the request body is malformed', () => {
                return chai.request(app)
                    .post('/users/login')
                    .send({
                        password: '001'
                    })
                    .then(res => {
                        expect(res).to.have.status(400);
                        expect(res).to.not.be.json;
                        expect(res.body).to.eql({});
                    });
            });
        });
    });
});

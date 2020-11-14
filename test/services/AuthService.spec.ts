import chai, { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import AuthServiceImpl from '../../src/services/AuthService';
import { AuthService, Configuration, ConfigurationService, User, UserService } from '../../src/types';
import { Request, Response } from 'express';
import proxyquire from 'proxyquire';

chai.use(sinonChai);

let service: AuthServiceImpl;
let userService: UserService;
let configService: ConfigurationService;
let proxyStubs: Record<string, SinonStub>;

let configuration: Configuration;

describe('AuthService', () => {
    beforeEach(() => {
        userService = {
            getUser(username: string): Promise<User | null> {
                return Promise.resolve({
                    name: username,
                    isLecturer: false,
                    id: 'TEST'
                });
            },
            isPasswordValid(): Promise<boolean> {
                return Promise.resolve(true);
            },
            addUser(username: string): Promise<User> {
                return this.getUser(username) as Promise<User>;
            },
            getAllUsers(): Promise<User[]> {
                return (this.getUser('TEST') as Promise<User>).then(val => [val]);
            }
        } as UserService;
        configService = {
            getConfiguration(): Promise<Readonly<Configuration>> {
                return Promise.resolve(configuration);
            },
            getOpenAPIDefinition(): Promise<Readonly<Record<string, unknown>>> {
                return Promise.resolve(Object.freeze({}));
            }
        } as ConfigurationService;

        configuration = {
            mongodb: {
                auth: {
                    password: 'TEST',
                    username: 'TEST'
                },
                port: 1887,
                host: 'localhost'
            },
            port: 3000,
            jwt: 'TEST'
        };


        proxyStubs = {
            sign: sinon.stub(),
            verify: sinon.stub()
        };
        const AuthServiceProxy = proxyquire.noCallThru()('../../src/services/AuthService', {
            'jsonwebtoken': proxyStubs
        }).default;

        service = new AuthServiceProxy(userService, configService);
    });

    describe('authorize', () => {
        it('should return a function', () => {
            expect(service.authorize()).to.be.a('function');
        });

        describe('the returned function', () => {
            it('should call send status 403 if no JWT is present in Authorization Header or JSESSION cookie',
                async () => {
                    const authorizeFunc = service.authorize();

                    const request = {
                        header: sinon.stub().returns(undefined),
                        cookies: {},
                        params: {}
                    };
                    const response = {
                        sendStatus: sinon.stub()
                    };
                    const next = sinon.stub();

                    await authorizeFunc(request as unknown as Request, response as unknown as Response, next);

                    expect(response.sendStatus).to.have.been.calledOnce;
                    expect(response.sendStatus).to.have.been.calledWith(403);
                });

            it('should call the next function with a username if a JWT is present in jsession cookie',
                async () => {
                    proxyStubs.verify.returns({
                        name: 'Test',
                        lecturer: false,
                        sub: 'Test',
                        iss: 'CourseDemoApp'
                    });

                    const authorizeFunc = service.authorize();

                    const request = {
                        header: sinon.stub().returns(undefined),
                        cookies: {
                            jsession: 'Test'
                        },
                        params: {}
                    } as any;
                    const response = {
                        sendStatus: sinon.stub()
                    };
                    const next = sinon.stub();

                    await authorizeFunc(request as unknown as Request, response as unknown as Response, next);

                    expect(next).to.have.been.calledOnce;
                    expect(request.params.username).to.be.eq('Test');
                });

            it('should call the next function with a username if a JWT is present in the Authorization header',
                async () => {
                    proxyStubs.verify.returns({
                        name: 'Test',
                        lecturer: false,
                        sub: 'Test',
                        iss: 'CourseDemoApp'
                    });

                    const authorizeFunc = service.authorize();

                    const request = {
                        header: sinon.stub().withArgs('Authorization').returns('Bearer TEST'),
                        cookies: {},
                        params: {}
                    } as any;
                    const response = {
                        sendStatus: sinon.stub()
                    };
                    const next = sinon.stub();

                    await authorizeFunc(request as unknown as Request, response as unknown as Response, next);

                    expect(next).to.have.been.calledOnce;
                    expect(request.params.username).to.be.eq('Test');
                });

            it('should fail if no JWT in cookie and authorization header set to non bearer',
                async () => {
                    proxyStubs.verify.returns({
                        name: 'Test',
                        lecturer: false,
                        sub: 'Test',
                        iss: 'CourseDemoApp'
                    });

                    const authorizeFunc = service.authorize();

                    const request = {
                        header: sinon.stub().withArgs('Authorization').returns('Basic TEST'),
                        cookies: {},
                        params: {}
                    } as any;
                    const response = {
                        sendStatus: sinon.stub()
                    };
                    const next = sinon.stub();

                    await authorizeFunc(request as unknown as Request, response as unknown as Response, next);

                    expect(next).to.have.not.been.called;
                    expect(response.sendStatus).to.have.been.calledOnce;
                    expect(response.sendStatus).to.have.been.calledWith(403);
                    expect(request.params.username).to.be.undefined;
                });
        });
    });

    describe('logIn', () => {
        it('should fail if password is wrong', async () => {
            userService.isPasswordValid = () => Promise.resolve(false);
            expect(await service.logIn('test', 'test')).to.be.undefined;
        });

        it('should return the user and a token if both match', async () => {
            proxyStubs.sign.returns('test');

            expect(await service.logIn('test', 'test')).to.eql({
                name: 'test',
                id: 'TEST',
                isLecturer: false,
                token: 'test'
            });
        });
    });

    describe('checkUsername', () => {
        it('should return a function', () => {
            expect(service.checkUsername()).to.be.a('function');
        });

        describe('the returned function', () => {
            it('should add the username if jwt token is present in cookies', async () => {
                proxyStubs.verify.returns({
                    name: 'Test',
                    lecturer: false,
                    sub: 'Test',
                    iss: 'CourseDemoApp'
                });
                const authorizeFunc = service.checkUsername();

                const request = {
                    header: sinon.stub().returns(undefined),
                    cookies: {
                        jsession: 'test'
                    },
                    params: {}
                } as any;
                const response = {
                    sendStatus: sinon.stub()
                };
                const next = sinon.stub();

                await authorizeFunc(request as unknown as Request, response as unknown as Response, next);

                expect(next).to.have.been.calledOnce;
                expect(request.params.username).to.be.eql('Test');
            });

            it('should add the username if jwt token is present in authorization header', async () => {
                proxyStubs.verify.returns({
                    name: 'Test',
                    lecturer: false,
                    sub: 'Test',
                    iss: 'CourseDemoApp'
                });
                const authorizeFunc = service.checkUsername();

                const request = {
                    header: sinon.stub().returns('Bearer test'),
                    cookies: {},
                    params: {}
                } as any;
                const response = {
                    sendStatus: sinon.stub()
                };
                const next = sinon.stub();

                await authorizeFunc(request as unknown as Request, response as unknown as Response, next);

                expect(next).to.have.been.calledOnce;
                expect(request.params.username).to.be.eql('Test');
            });

            it('should not add a username if jwt token in neither cookie nor authorization header', async () => {
                proxyStubs.verify.returns({
                    name: 'Test',
                    lecturer: false,
                    sub: 'Test',
                    iss: 'CourseDemoApp'
                });
                const authorizeFunc = service.checkUsername();

                const request = {
                    header: sinon.stub().returns(undefined),
                    cookies: {},
                    params: {}
                } as any;
                const response = {
                    sendStatus: sinon.stub()
                };
                const next = sinon.stub();

                await authorizeFunc(request as unknown as Request, response as unknown as Response, next);

                expect(next).to.have.been.calledOnce;
                expect(request.params.username).to.be.undefined;
            });

            it('should not add a username if authorization header is not set to bearer', async () => {
                proxyStubs.verify.returns({
                    name: 'Test',
                    lecturer: false,
                    sub: 'Test',
                    iss: 'CourseDemoApp'
                });
                const authorizeFunc = service.checkUsername();

                const request = {
                    header: sinon.stub().returns('Basic test'),
                    cookies: {},
                    params: {}
                } as any;
                const response = {
                    sendStatus: sinon.stub()
                };
                const next = sinon.stub();

                await authorizeFunc(request as unknown as Request, response as unknown as Response, next);

                expect(next).to.have.been.calledOnce;
                expect(request.params.username).to.be.undefined;
            });
        });
    });
});

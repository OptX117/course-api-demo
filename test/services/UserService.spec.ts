import proxyquire from 'proxyquire';
import chai, { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import sinonChai from 'sinon-chai';
import UserServiceImpl from '../../src/services/UserService';

chai.use(sinonChai);

let service: UserServiceImpl;
let proxyStubs: Record<string, SinonStub>;

describe('UserService', () => {
    beforeEach(() => {
        proxyStubs = {
            findOne: sinon.stub(),
            find: sinon.stub()
        };
        const UserServiceProxy = proxyquire.noCallThru()('../../src/services/UserService', {
            '../models/User': proxyStubs
        }).default;

        service = new UserServiceProxy() as UserServiceImpl;
    });

    describe('getUser(username: string)', () => {
        it('should get a user by username', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve({
                    name: 'TEST',
                    _id: 'TEST',
                    isLecturer: false
                })
            });

            const user = await service.getUser('test');

            expect(proxyStubs.findOne).to.have.been.calledOnce;
            expect(proxyStubs.findOne).to.have.been.calledWith({name: 'test'});

            expect(user).to.not.be.null;
            if (user != null) {
                expect(user.id).to.eq('TEST');
                expect(user.name).to.eq('TEST');
                expect(user.isLecturer).to.be.false;
            }
        });

        it('should not return a password hash if it finds a user', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve({
                    name: 'TEST',
                    _id: 'TEST',
                    isLecturer: false,
                    passwordHash: 'TEST1234'
                })
            });

            const user = await service.getUser('test') as any;

            expect(proxyStubs.findOne).to.have.been.calledOnce;
            expect(proxyStubs.findOne).to.have.been.calledWith({name: 'test'});

            expect(user).to.not.be.null;
            if (user != null) {
                expect(user.id).to.eq('TEST');
                expect(user.name).to.eq('TEST');
                expect(user.isLecturer).to.be.false;
                expect(user.passwordHash).to.be.undefined;
            }
        });

        it('should not return a user if none is found', async () => {

            proxyStubs.findOne.returns({
                exec: () => Promise.resolve(null)
            });

            const user = await service.getUser('test') as any;

            expect(proxyStubs.findOne).to.have.been.calledOnce;
            expect(proxyStubs.findOne).to.have.been.calledWith({name: 'test'});

            expect(user).to.be.null;
        });
    });

    describe('getAllUsers()', () => {
        it('should return a list of all found users', async () => {
            proxyStubs.find.returns({
                exec: () => Promise.resolve([
                    {
                        name: 'TEST',
                        _id: 'TEST',
                        isLecturer: false,
                        passwordHash: 'TEST1234'
                    },
                    {
                        name: 'TEST2',
                        _id: 'TEST2',
                        isLecturer: true,
                        passwordHash: 'TEST12342'
                    }
                ])
            });

            const users = await service.getAllUsers();

            expect(proxyStubs.find).to.have.been.calledOnce;
            expect(users.length).to.be.eq(2);

            const [user1, user2] = users;

            expect(user1).to.eql({
                name: 'TEST',
                id: 'TEST',
                isLecturer: false
            });
            expect(user2).to.eql({
                name: 'TEST2',
                id: 'TEST2',
                isLecturer: true
            });

        });

        it('should return a list of all found users without password hashes', async () => {
            proxyStubs.find.returns({
                exec: () => Promise.resolve([
                    {
                        name: 'TEST',
                        _id: 'TEST',
                        isLecturer: false,
                        passwordHash: 'TEST1234'
                    },
                    {
                        name: 'TEST2',
                        _id: 'TEST2',
                        isLecturer: true,
                        passwordHash: 'TEST12342'
                    }
                ])
            });

            const users = await service.getAllUsers();

            expect(proxyStubs.find).to.have.been.calledOnce;
            expect(users.length).to.be.eq(2);

            const [user1, user2] = users as any[];

            expect(user1.passwordHash).to.be.undefined;
            expect(user2.passwordHash).to.be.undefined;
        });

        it('should return an empty list if no users are found', async () => {
            proxyStubs.find.returns({
                exec: () => Promise.resolve([])
            });

            const users = await service.getAllUsers();

            expect(proxyStubs.find).to.have.been.calledOnce;
            expect(users.length).to.be.eq(0);
        });
    });

    describe('isPasswordValid(username: string, password: string)', () => {
        it('should return true if the password was correct', async () => {
            const isPasswordValid = sinon.stub().returns(true);

            proxyStubs.findOne.returns({
                exec: () => Promise.resolve({
                    name: 'TEST',
                    _id: 'TEST',
                    isLecturer: false,
                    passwordHash: 'TEST1234',
                    isPasswordValid
                })
            });

            expect(await service.isPasswordValid('test', 'testPW')).to.be.true;

            expect(proxyStubs.findOne).to.have.been.calledOnce;
            expect(proxyStubs.findOne).to.have.been.calledWith({name: 'test'});

            expect(isPasswordValid).to.have.been.calledOnce;
            expect(isPasswordValid).to.have.been.calledWith('testPW');
        });

        it('should return false if the password was incorrect', async () => {
            const isPasswordValid = sinon.stub().returns(false);

            proxyStubs.findOne.returns({
                exec: () => Promise.resolve({
                    name: 'TEST',
                    _id: 'TEST',
                    isLecturer: false,
                    passwordHash: 'TEST1234',
                    isPasswordValid
                })
            });

            expect(await service.isPasswordValid('test', 'testPW')).to.be.false;

            expect(proxyStubs.findOne).to.have.been.calledOnce;
            expect(proxyStubs.findOne).to.have.been.calledWith({name: 'test'});

            expect(isPasswordValid).to.have.been.calledOnce;
            expect(isPasswordValid).to.have.been.calledWith('testPW');

        });

        it('should return false if no user was found', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve(null)
            });

            expect(await service.isPasswordValid('test', 'testPW')).to.be.false;

            expect(proxyStubs.findOne).to.have.been.calledOnce;
            expect(proxyStubs.findOne).to.have.been.calledWith({name: 'test'});
        });
    });
});






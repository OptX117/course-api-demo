import { BookingService, CourseCategory, User } from '../../src/types';
import sinon, { SinonStub } from 'sinon';
import proxyquire from 'proxyquire';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

let service!: BookingService;
let proxyStubs: Record<string, SinonStub>;

describe('BookingService', () => {
    beforeEach(() => {
        proxyStubs = {
            findOne: sinon.stub(),
            find: sinon.stub(),
            create: sinon.stub(),
            count: sinon.stub(),
            save: sinon.stub(),
            delete: sinon.stub()
        };

        const BookingServiceProxy = proxyquire.noCallThru()('../../src/services/BookingService', {
            '../models/CourseDateBooking': proxyStubs
        }).default;

        service = new BookingServiceProxy();
    });

    describe('getBooking()', () => {

        it('should get a booking by it\'s id', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve({
                    _id: 'TEST',
                    user: 'TEST',
                    spots: 3,
                    date: 'TEST',
                    course: 'TEST'
                })
            });

            const booking = await service.getBooking('TEST');
            expect(booking).to.be.eql({
                id: 'TEST',
                user: 'TEST',
                spots: 3,
                date: 'TEST',
                course: 'TEST'
            });
        });

        it('should not return a booking if none is found', async () => {

            proxyStubs.findOne.returns({
                exec: () => Promise.resolve()
            });

            const booking = await service.getBooking('TEST');
            expect(booking).to.be.undefined;
        });
    });

    describe('bookSpots()', () => {
        it('should return the saved values', async () => {
            const bookingToSave = {
                id: 'TEST',
                user: 'TEST',
                spots: 2,
                course: 'TEST',
                date: 'TEST'
            };


            proxyStubs.create.returns(Promise.resolve(Object.assign({_id: bookingToSave.id}, bookingToSave)));
            proxyStubs.find.returns({
                exec: () => Promise.resolve([{
                    _id: 'TESTOLD',
                    user: 'TESTUSER',
                    spots: 5,
                    course: 'TESTCOURSE'
                }])
            });
            proxyStubs.count.returns({
                exec: () => Promise.resolve(7)
            });

            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };

            const booking = await service.bookSpots({
                id: bookingToSave.course,
                dates: [{
                    id: 'TEST',
                    startDate: '2020-11-28T18:00:00+01:00',
                    endDate: '2020-11-28T20:00:00+01:00',
                    totalSpots: 7
                }],
                lecturer: user,
                organiser: 'ICH',
                category: 'Sprachkurs',
                description: 'TESTCOURSE',
                price: 1887,
                title: 'TESTCOURSE'
            }, user, bookingToSave.spots, bookingToSave.date);

            expect(booking).to.eql(bookingToSave);

            expect(proxyStubs.count).to.have.been.calledOnce;
            expect(proxyStubs.count).to.have.been.calledWith({
                course: bookingToSave.course,
                date: bookingToSave.date
            });
        });

        it('should throw an error and not save the booking if no more spots are available', async () => {
            const bookingToSave = {
                id: 'TEST',
                user: 'TEST',
                spots: 2,
                course: 'TEST',
                date: 'TEST'
            };


            proxyStubs.create.returns(Promise.resolve(Object.assign({_id: bookingToSave.id}, bookingToSave)));
            proxyStubs.find.returns({
                exec: () => Promise.resolve([{
                    _id: 'TESTOLD',
                    user: 'TESTUSER',
                    spots: 5,
                    course: 'TESTCOURSE'
                }])
            });
            proxyStubs.count.returns({
                exec: () => Promise.resolve(1)
            });

            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };

            try {
                await service.bookSpots({
                    id: bookingToSave.course,
                    dates: [{
                        id: 'TEST',
                        startDate: '2020-11-28T18:00:00+01:00',
                        endDate: '2020-11-28T20:00:00+01:00',
                        totalSpots: 7
                    }],
                    lecturer: user,
                    organiser: 'ICH',
                    category: 'Sprachkurs',
                    description: 'TESTCOURSE',
                    price: 1887,
                    title: 'TESTCOURSE'
                }, user, bookingToSave.spots, bookingToSave.date);
            } catch (err) {
                expect(err.message).to.include('No open spots left. Tried to book 2 from available 1');
            }

            expect(proxyStubs.count).to.have.been.calledOnce;
            expect(proxyStubs.count).to.have.been.calledWith({
                course: bookingToSave.course,
                date: bookingToSave.date
            });
        });
    });

    describe('getBookings()', () => {
        it('should return a list of all bookings of a user of a course if not a lecturer', async () => {
            const availableBookings = [
                {
                    _id: 'TESTOLD',
                    user: 'TESTUSER',
                    spots: 5,
                    date: 'TESTDATE',
                    course: 'TESTCOURSE'
                },
                {
                    _id: 'TESTOLD2',
                    user: 'TESTUSER',
                    spots: 2,
                    date: 'TESTDATE2',
                    course: 'TESTCOURSE'
                }
            ];

            proxyStubs.find.returns({
                exec: () => Promise.resolve(availableBookings)
            });

            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };

            const course = {
                id: 'TESTCOURSE',
                dates: [{
                    id: 'TEST',
                    startDate: '2020-11-28T18:00:00+01:00',
                    endDate: '2020-11-28T20:00:00+01:00',
                    totalSpots: 7
                }],
                lecturer: user,
                organiser: 'ICH',
                category: 'Sprachkurs' as CourseCategory,
                description: 'TESTCOURSE',
                price: 1887,
                title: 'TESTCOURSE'
            };

            const list = await service.getBookings(course, user);

            expect(list).to.eql(availableBookings.map(e => ({
                id: e._id,
                course: e.course,
                date: e.date,
                user: e.user,
                spots: e.spots
            })));

            expect(proxyStubs.find).to.have.been.calledOnce;
            expect(proxyStubs.find).to.have.been.calledWith({
                course: course.id,
                user: user.id
            });
        });

        it('should return a list of all bookings of a course if a lecturer', async () => {
            const availableBookings = [
                {
                    _id: 'TESTOLD',
                    user: 'TESTUSER',
                    spots: 5,
                    date: 'TESTDATE',
                    course: 'TESTCOURSE'
                },
                {
                    _id: 'TESTOLD2',
                    user: 'TESTUSER',
                    spots: 2,
                    date: 'TESTDATE2',
                    course: 'TESTCOURSE'
                }
            ];

            proxyStubs.find.returns({
                exec: () => Promise.resolve(availableBookings)
            });

            const user: User = {
                id: 'TESTUSER',
                isLecturer: true,
                name: 'TESTUSER'
            };

            const course = {
                id: 'TESTCOURSE',
                dates: [{
                    id: 'TEST',
                    startDate: '2020-11-28T18:00:00+01:00',
                    endDate: '2020-11-28T20:00:00+01:00',
                    totalSpots: 7
                }],
                lecturer: user,
                organiser: 'ICH',
                category: 'Sprachkurs' as CourseCategory,
                description: 'TESTCOURSE',
                price: 1887,
                title: 'TESTCOURSE'
            };

            const list = await service.getBookings(course, user);

            expect(list).to.eql(availableBookings.map(e => ({
                id: e._id,
                course: e.course,
                date: e.date,
                user: e.user,
                spots: e.spots
            })));

            expect(proxyStubs.find).to.have.been.calledOnce;
            expect(proxyStubs.find).to.have.been.calledWith({
                course: course.id
            });
        });
    });

    describe('getAllUserBookings()', () => {
        it('should return all bookings of a user', async () => {
            const availableBookings = [
                {
                    _id: 'TESTOLD',
                    user: 'TESTUSER',
                    spots: 5,
                    date: 'TESTDATE',
                    course: 'TESTCOURSE'
                },
                {
                    _id: 'TESTOLD2',
                    user: 'TESTUSER',
                    spots: 2,
                    date: 'TESTDATE2',
                    course: 'TESTCOURSE'
                }
            ];

            proxyStubs.find.returns({
                exec: () => Promise.resolve(availableBookings)
            });

            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };

            const list = await service.getAllUserBookings(user);

            expect(list).to.eql(availableBookings.map(e => ({
                id: e._id,
                course: e.course,
                date: e.date,
                user: e.user,
                spots: e.spots
            })));

            expect(proxyStubs.find).to.have.been.calledOnce;
            expect(proxyStubs.find).to.have.been.calledWith({
                user: user.id
            });
        });
    });

    describe('updateBooking()', () => {
        it('should update a booking if one was found', async () => {
            const oldBooking = {
                id: 'TEST',
                user: 'TEST',
                spots: 2,
                course: 'TEST',
                date: 'TEST'
            };

            const bookingUpdate = {
                spots: 3
            };
            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };

            proxyStubs.save.returns(Promise.resolve(Object.assign({_id: oldBooking.id}, oldBooking)));
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve({
                    _id: 'TESTOLD',
                    user: 'TESTUSER',
                    spots: 1,
                    course: 'TEST',
                    save: proxyStubs.save,
                    date: 'TEST'
                })
            });
            proxyStubs.count.returns({
                exec: () => Promise.resolve(7)
            });

            const booking = await service.updateBooking('TEST', bookingUpdate, user);

            expect(booking).to.eql(oldBooking);

            expect(proxyStubs.count).to.have.been.calledOnce;
            expect(proxyStubs.count).to.have.been.calledWith({
                course: oldBooking.course,
                date: oldBooking.date
            });
        });

        it('should not update a booking if none was found', async () => {
            const oldBooking = {
                id: 'TEST',
                user: 'TEST',
                spots: 2,
                course: 'TEST',
                date: 'TEST'
            };

            const bookingUpdate = {
                spots: 3
            };

            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };
            proxyStubs.save.returns(Promise.resolve(Object.assign({_id: oldBooking.id}, oldBooking)));
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve()
            });
            proxyStubs.count.returns({
                exec: () => Promise.resolve(7)
            });

            const booking = await service.updateBooking('TEST', bookingUpdate, user);

            expect(booking).to.be.undefined;
        });

        it('should throw an error and not update a booking if more spots than available should be booked', async () => {

            const bookingUpdate = {
                spots: 10
            };

            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve({
                    _id: 'TESTOLD',
                    user: 'TESTUSER',
                    spots: 1,
                    course: 'TEST',
                    save: proxyStubs.save,
                    date: 'TEST'
                })
            });
            proxyStubs.count.returns({
                exec: () => Promise.resolve(7)
            });

            try {
                await service.updateBooking('TEST', bookingUpdate, user);
            } catch (err) {
                expect(err.message).to.include('No open spots left. Tried to book additional 9 from available 7');
                return;
            }

            expect(true).to.eql(false, 'Service did not throw error!');
        });
    });

    describe('deleteBooking()', () => {
        it('should delete a booking if one was found for the given user', async () => {
            proxyStubs.delete.returns(Promise.resolve({
                _id: 'TESTOLD',
                user: 'TESTUSER',
                spots: 1,
                course: 'TEST',
                deleteOne: proxyStubs.delete,
                date: 'TEST'
            }));
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve({
                    _id: 'TESTOLD',
                    user: 'TESTUSER',
                    spots: 1,
                    course: 'TEST',
                    deleteOne: proxyStubs.delete,
                    date: 'TEST'
                })
            });
            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };

            const deleted = await service.deleteBooking('TESTOLD', user);
            expect(deleted).to.eql({
                id: 'TESTOLD',
                user: 'TESTUSER',
                spots: 1,
                course: 'TEST',
                date: 'TEST'
            });

            expect(proxyStubs.findOne).to.have.been.calledOnce;
            expect(proxyStubs.findOne).to.have.been.calledWith({_id: 'TESTOLD', user: user.id});
            expect(proxyStubs.delete).to.have.been.calledOnce;
        });
        it('should not delete a booking if none was found for the given user', async () => {
            proxyStubs.findOne.returns({
                exec: () => Promise.resolve()
            });
            const user: User = {
                id: 'TESTUSER',
                isLecturer: false,
                name: 'TESTUSER'
            };

            const deleted = await service.deleteBooking('TESTOLD', user);
            expect(deleted).to.be.undefined;

            expect(proxyStubs.findOne).to.have.been.calledOnce;
            expect(proxyStubs.findOne).to.have.been.calledWith({_id: 'TESTOLD', user: user.id});
        });
    });
});

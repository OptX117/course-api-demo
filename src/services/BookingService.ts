import { BookingService, Course, CourseDateBooking, CourseDateBookingUpdate, User } from '../types';
import CourseDateBookingModel from '../models/CourseDateBooking';
import { MongooseDocument } from 'mongoose';
import logger from '../winston';

export default class BookingServiceImpl implements BookingService {
    private static convertCourseDateBookingModelToCourseDate(model: MongooseDocument): CourseDateBooking {
        return {
            id: model._id,
            spots: (model as any).spots,
            user: (model as any).user,
            course: (model as any).course,
            date: (model as any).date
        };
    }

    public async bookSpots(course: Course, user: User, spots: number, dateId: string): Promise<CourseDateBooking> {
        const openSpots = await this.getOpenSpots(course, dateId);
        if (openSpots < spots) {
            throw new Error(`No open spots left. Tried to book ${spots} from available ${openSpots}`);
        }

        return BookingServiceImpl.convertCourseDateBookingModelToCourseDate(await CourseDateBookingModel.create({
            course: course.id,
            date: dateId,
            user: user.id,
            spots: spots
        }));
    }

    public async deleteBooking(bookingId: string, user: User): Promise<CourseDateBooking | undefined> {
        const model = await CourseDateBookingModel.findOne({_id: bookingId, user: user.id}).exec();
        if (model == null) {
            return;
        }

        return await model.deleteOne().then(el => BookingServiceImpl.convertCourseDateBookingModelToCourseDate(el));
    }

    public async getBooking(bookingId: string): Promise<CourseDateBooking | undefined> {
        try {
            const found = await CourseDateBookingModel.findOne({_id: bookingId}).exec();
            if (found) {
                return BookingServiceImpl.convertCourseDateBookingModelToCourseDate(found);
            }
        } catch (err) {
           logger.error('Error finding course date booking!', {err});
        }

    }

    public async getBookings(course: Course, user: User): Promise<CourseDateBooking[]> {
        if (user.isLecturer && course.lecturer.id === user.id) {
            return await CourseDateBookingModel.find({course: course.id}).exec()
                .then(list => list.map(el => BookingServiceImpl.convertCourseDateBookingModelToCourseDate(el)));
        } else {
            return await CourseDateBookingModel.find({
                course: course.id,
                user: user.id
            }).exec().then(list => list.map(el => BookingServiceImpl.convertCourseDateBookingModelToCourseDate(el)));
        }
    }

    public async updateBooking(bookingId: string,
                               booking: CourseDateBookingUpdate, user: User): Promise<CourseDateBooking | undefined> {
        const model = await CourseDateBookingModel.findOne({_id: bookingId, user: user.id}).exec();
        if (model == null) {
            return;
        }

        if (booking.spots != null && booking.spots > (model as any).spots) {
            const openSpots = await this.getOpenSpots({id: (model as any).course} as any, (model as any).date);
            if (openSpots < booking.spots) {
                throw new Error(`No open spots left. Tried to book additional ${booking.spots -
                                                                                (model as any).spots} from available ${openSpots}`);
            }
        }

        (model as any).spots = booking.spots;

        return await model.save().then(el => BookingServiceImpl.convertCourseDateBookingModelToCourseDate(el));
    }

    public async getOpenSpots(course: Course, dateId: string): Promise<number> {
        return CourseDateBookingModel.count({
            date: dateId,
            course: course.id
        }).exec();
    }

    public getAllUserBookings(user: User): Promise<CourseDateBooking[]> {
        return CourseDateBookingModel.find({
            user: user.id
        }).exec().then(list => list.map(el => BookingServiceImpl.convertCourseDateBookingModelToCourseDate(el)));
    }
}

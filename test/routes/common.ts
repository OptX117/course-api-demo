import chai from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import proxyquire from 'proxyquire';
import initApplication from '../../src/app';
import mongodb from 'mongodb';
import mongoose from 'mongoose';
import { Express } from 'express';
import { Course, CourseCategory, User } from '../../src/types';
import path from 'path';
import { nanoid } from 'nanoid';

chai.use(chaiHttp);
chai.use(sinonChai);

async function getApp(): Promise<Express> {
    const {app} = await initApplication(path.join(__dirname, '..', '..', 'bin', 'config'),
        path.join(__dirname, '..', '..', 'bin', 'schemas'));

    return app;
}

async function setupDB(): Promise<void> {
    await mongoose.connection.dropDatabase();

    const insertedCategories = await mongoose.connection.collection('coursecategories').insertMany([
        {
            name: 'Konferenz'
        },
        {
            name: 'Meeting'
        },
        {
            name: 'Sprachkurs'
        },
        {
            name: 'Weiterbildung'
        }]).then(res => res.ops.reduce((previousValue, currentValue) => {
        previousValue[currentValue.name] = currentValue._id;
        return previousValue;
    }, {}));


    const insertedUsers = await mongoose.connection.collection('users').insertMany([
        {
            name: '001',
            isLecturer: false,
            salt: 'd85a89bf97f59037c67d2be12bbdb7fd',
            passwordHash: '128e4d935580c9af19ee379bedbd5b6c8ae4bd20dc54b6c5722840d839604d4ef7c998753ae36ba2536e27ff064a91121af4a2e58a8bb7ee9d6e999118265be1'
        },
        {
            name: '002',
            isLecturer: true,
            salt: 'dcff918224563f96c7a0ecd9ab78f63f',
            passwordHash: '40eed90f9c33089c23ed985be9653e8b5db451e1e8ed892fa5e671e44833f0ac21453e2e118fd66a17a7ddc7a2b31071eba84268418830a5b417bf29bd02fa94'
        },
        {
            name: '003',
            isLecturer: true,
            salt: 'bfbffa287f6cbcbae5060e4aea63cb12',
            passwordHash: 'e687a85e6a6f479dc5e026284e4ce1d8ff74baa55c590bd3dfae6652026a0470c8712419fc0ea3e6929d7ac25a2e79341b48581426073f7186b91f809d600ac6'
        }]).then(res => res.ops.reduce((previousValue, currentValue) => {
        previousValue[currentValue.name] = currentValue._id;
        return previousValue;
    }, {}));

    await mongoose.connection.collection('courses').insertMany([
        {
            title: 'TEST',
            dates: [{
                id: nanoid(4),
                startDate: '2020-11-13T18:00:00+01:00',
                endDate: '2020-11-13T20:00:00+01:00',
                totalSpots: 10
            }, {
                id: nanoid(4),
                startDate: '2020-11-20T18:00:00+01:00',
                endDate: '2020-11-20T20:00:00+01:00',
                totalSpots: 5
            }],
            price: 1887,
            description: 'TEST',
            category: new mongodb.ObjectID(insertedCategories.Konferenz),
            lecturer: new mongodb.ObjectID(insertedUsers['002']),
            organiser: 'TEST'
        }]).then(res => res.ops.reduce((previousValue, currentValue) => {
        previousValue[currentValue.name] = currentValue._id;
        return previousValue;
    }, {}));
}

async function getDBEntries(): Promise<{ users: Record<string, User>, courses: Record<string, Course>, courseCategories: CourseCategory[] }> {
    const users = await mongoose.models.User.find().exec().then(docs => docs.map(doc => ({
        id: doc._id.toString(),
        name: doc.name,
        isLecturer: doc.isLecturer
    })).reduce((previousValue, currentValue) => {
        previousValue[currentValue.name] = currentValue;
        return previousValue;
    }, {} as Record<string, User>));
    const courses = await mongoose.models.Course.find().exec()
        .then(docs => (Promise.all(docs.map(async doc => ({
            id: doc._id.toString(),
            title: doc.title,
            lecturer: await mongoose.models.User.findOne({_id: doc.lecturer}).exec().then(doc => ({
                id: doc._id.toString(),
                name: doc.name,
                isLecturer: doc.isLecturer
            })),
            description: doc.description || undefined,
            category: await mongoose.models.CourseCategory.findOne({_id: doc.category}).exec().then(doc => doc.name),
            price: doc.price,
            organiser: doc.organiser || undefined,
            dates: doc.dates
        } as Course)))))
        .then(courses => courses.reduce((previousValue, currentValue) => {
            const dates = currentValue.dates;
            currentValue.dates = dates.map(v => ({
                id: v.id,
                startDate: v.startDate,
                endDate: v.endDate,
                totalSpots: v.totalSpots
            }));

            for (const key in currentValue) {
                // eslint-disable-next-line no-prototype-builtins
                if (currentValue.hasOwnProperty(key)) {
                    if (currentValue[key as keyof Course] == null) {
                        delete currentValue[key as keyof Course];
                    }
                }
            }

            previousValue[currentValue.title] = currentValue;
            return previousValue;
        }, {} as Record<string, Course>));
    const courseCategories = await mongoose.models.CourseCategory.find().exec().then(docs => docs.reduce((previousValue,
                                                                                                          currentValue) => {
        previousValue.push(currentValue.name);
        return previousValue;
    }, []));

    return {users, courses, courseCategories};
}

async function disconnectDB(): Promise<void> {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
}

async function doLogin(app: ChaiHttp.Agent, lecturer = true): Promise<User & { token: string }> {
    return app.post('/users/login')
        .send({
            username: lecturer ? '002' : '001',
            password: lecturer ? '002' : '001'
        }).then(res => res.body);
}

export default {chai, proxyquire, getApp, disconnectDB, getDBEntries, setupDB, mongoose, doLogin};

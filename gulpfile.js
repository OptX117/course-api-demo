const gulp = require('gulp');
const fs = require('fs').promises;
const mergeStream = require('merge-stream');
const debug = require('gulp-debug');
const log = require('fancy-log');
const path = require('path');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');
const swaggerJSDoc = require('swagger-jsdoc');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const nanoid = require('nanoid').nanoid;
const spawn = require('child_process').spawn;

const packageJson = require('./package.json');
const srcConfig = require('./src/config/config.json');
const targetPath = path.join(__dirname, 'bin');
const srcPath = path.join(__dirname, 'src');

let node;
let docker;

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: packageJson.api.title,
        version: packageJson.version,
        description: packageJson.api.description,
    },
};

gulp.task('webpack', () => {
    const webpackConfig = require('./webpack.config.js');
    return gulp.src(path.join(srcPath, 'app.ts'))
        .pipe(gulpWebpack(webpackConfig, webpack))
        .on('error', (err) => console.log(err))
        .pipe(gulp.dest(targetPath));
});

gulp.task('generate-openapi-json', async () => {
    const definitions = swaggerJSDoc({
        swaggerDefinition,
        apis: [
            path.join(srcPath, 'routes', '**/*.ts'),
            path.join(srcPath, 'models', '**/*.ts')
        ]
    });

    await fs.writeFile(path.join(targetPath, 'config', 'openapi.json'), JSON.stringify(definitions, null, 4));
});

gulp.task('generate-json-schemas-from-openapi-json', async () => {
    const {components} = require(path.join(targetPath, 'config', 'openapi.json'));
    const {schemas, requestBodies} = components;

    log.info('Generating response schemas.');
    for (const [key, value] of Object.entries(schemas)) {
        const schemaName = key.toLowerCase();
        value.$id = `/${schemaName.toLowerCase()}.schema.json`;
        const stringToWrite = JSON.stringify(value, null, 4)
            .replace(/#\/components\/schemas\/([^\s"]+)/gim, (substring, args) => {
                return `/${args.toLowerCase()}.schema.json`;
            });
        await fs.writeFile(path.join(targetPath, 'schemas', `${schemaName}.schema.json`), stringToWrite);
    }

    log.info('Generating request body schemas.');
    for (const [key, value] of Object.entries(requestBodies)) {
        const schema = value.content['application/json']?.schema;
        if (schema != null) {
            const schemaName = key.toLowerCase() + '.requestbody';
            schema.$id = `/${schemaName.toLowerCase()}.schema.json`;
            const stringToWrite = JSON.stringify(schema, null, 4)
                .replace(/#\/components\/schemas\/([^\s"]+)/gim, (substring, args) => {
                    return `/${args.toLowerCase()}.schema.json`;
                });
            await fs.writeFile(path.join(targetPath, 'schemas', `${schemaName}.schema.json`), stringToWrite);
        }
    }
});

gulp.task('copy-static-json-files', () => {
    const folders = ['config', 'schemas'];

    log.info(`Copying static json files from ${folders.join(', ')}.`);

    return mergeStream(folders.map(folder => gulp.src(path.join(srcPath, folder) + '/**/*.json')
        .pipe(debug({title: `Copying:`}))
        .pipe(gulp.dest(path.join(targetPath, folder)))));
});

gulp.task('build', gulp.series('webpack', 'copy-static-json-files', 'generate-openapi-json', 'generate-json-schemas-from-openapi-json'));

gulp.task('start', async () => {
    if (node) node.kill();
    log.info('Starting node server!');
    node = spawn('node', [path.join(targetPath, 'app.js')], {
        cwd: targetPath,
        stdio: 'inherit'
    });
    node.on('close', function (code) {
        if (code === 8) {
            log.error('Error detected, waiting for changes...');
        }
    });
});


function startDB(cb) {
    if (docker) docker.kill();
    fs.mkdir('db').catch();

    log.info('Starting database!');
    docker = spawn('docker', ['run', '--rm', '-p', '27017:27017', '-e', 'MONGO_INITDB_ROOT_USERNAME=root', '-e', 'MONGO_INITDB_ROOT_PASSWORD=example', '-v', `${path.normalize(path.resolve(__dirname, 'db'))}:/data/db`, 'mongo:3'], {
        stdio: 'inherit'
    });
    docker.on('close', function (code) {
        if (code === 8) {
            log.error('Error detected, waiting for changes...');
        }
    });
    cb();
}

async function connectDB() {
    const mongodb = srcConfig.mongodb;
    return await mongoose.connect(`mongodb://${mongodb.auth.username}:${mongodb.auth.password}@${mongodb.host}:${mongodb.port ||
        27017}/lecturedb?authSource=admin`,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
}

gulp.task('start-db', (cb) => {
    startDB(cb);
});

gulp.task('clear-db', async () => {
    const connected = await connectDB();
    await connected.connection.dropDatabase();
});

gulp.task('fill-db', gulp.series('start-db', 'clear-db', async () => {
    log.info('Filling DB with demo data');
    const connected = await connectDB();

    const insertedCategories = await connected.connection.collection('coursecategories').insertMany([
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


    const insertedUsers = await connected.connection.collection('users').insertMany([
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

    const insertedCourses = await connected.connection.collection('courses').insertMany([
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
            lecturer: new mongodb.ObjectID(insertedUsers['002'])
        }]).then(res => res.ops.reduce((previousValue, currentValue) => {
        previousValue[currentValue.title] = currentValue;
        return previousValue;
    }, {}));

    const insertedBookings = await connected.connection.collection('coursedatebookings').insertMany([
        {
            course: insertedCourses['TEST']._id,
            user: insertedUsers['001']._id,
            spots: 2,
            date: insertedCourses['TEST'].dates[0].id
        },
        {
            course: insertedCourses['TEST']._id,
            user: insertedUsers['001']._id,
            spots: 3,
            date: insertedCourses['TEST'].dates[1].id
        },
        {
            course: insertedCourses['TEST']._id,
            user: insertedUsers['003']._id,
            spots: 1,
            date: insertedCourses['TEST'].dates[1].id
        }
    ]).then(res => res.ops.reduce((previousValue, currentValue) => {
        previousValue[currentValue.name] = currentValue._id;
        return previousValue;
    }, {}));


    log.info(`Inserted ${Object.keys(insertedCategories).length} categories, ${
        Object.keys(insertedUsers).length} users, ${Object.keys(insertedCourses).length} courses and ${
        Object.keys(insertedBookings).length} bookings.`);
    connected.disconnect();
    docker.kill();
}));

gulp.task('test', gulp.series(['build', (cb) => {
    startDB(() => {
        const test = spawn('mocha', ['test/**/*.spec.ts'], {
            stdio: 'inherit'
        });
        test.on('close', function () {
            docker.kill();
            cb();
        });
    });
}]));

gulp.task('watch', gulp.series('build', 'start-db', 'start', () => {
    const watchPath = path.join(srcPath, '**/*');
    log.info(`Watching ${watchPath} for changes`);
    return gulp.watch(watchPath, gulp.series((cb) => {
        if (node) node.kill();
        cb();
    }, 'build', 'start'));
}));

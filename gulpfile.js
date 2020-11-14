const gulp = require('gulp');
const fs = require('fs').promises;
const mergeStream = require('merge-stream');
const debug = require('gulp-debug');
const log = require('fancy-log');
const path = require('path');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');
const swaggerJSDoc = require('swagger-jsdoc');

const spawn = require('child_process').spawn;

const packageJson = require('./package.json');

const targetPath = path.join(__dirname, 'bin');
const srcPath = path.join(__dirname, 'src');

let node;

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
            path.join(srcPath, 'routes', '**/*.ts')
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
            })
        await fs.writeFile(path.join(targetPath, 'schemas', `${schemaName}.schema.json`), stringToWrite);
    }

    log.info('Generating request body schemas.');
    for (const [key, value] of Object.entries(requestBodies)) {
        const schema = value.content["application/json"]?.schema;
        if(schema != null) {
            const schemaName = key.toLowerCase() + '.requestbody';
            schema.$id = `/${schemaName.toLowerCase()}.schema.json`;
            const stringToWrite = JSON.stringify(schema, null, 4)
                .replace(/#\/components\/schemas\/([^\s"]+)/gim, (substring, args) => {
                    return `/${args.toLowerCase()}.schema.json`;
                })
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

gulp.task('start', (cb) => {
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
    cb();
});

gulp.task('watch', gulp.series('build', 'start', () => {
    const watchPath = path.join(srcPath, '**/*');
    log.info(`Watching ${watchPath} for changes`);
    return gulp.watch(watchPath, gulp.series((cb) => {
        if (node) node.kill();
        cb();
    }, 'build', 'start'));
}));

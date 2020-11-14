import http from 'http';
import express, { NextFunction } from 'express';
import path from 'path';
import expressWinston from 'express-winston';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

import Constants from './constants';

import logger from './winston';
import ConfigurationServiceImpl from './services/ConfigService';
import SchemaServiceImpl from './services/SchemaService';

import registerRoutes from './routes';
import CourseServiceImpl from './services/CourseService';
import UserServiceImpl from './services/UserService';
import AuthServiceImpl from './services/AuthService';





async function main() {
    try {
        logger.info('Starting');

        const app = express();
        app.use(express.json());
        app.use(cookieParser());

        app.use(expressWinston.logger({winstonInstance: logger}));
        app.use(expressWinston.errorLogger({winstonInstance: logger}));

        app.set(Constants.Logger, logger);

        // Used for request body validation
        const validationService = new SchemaServiceImpl(path.join(process.cwd(), 'schemas'));
        // Simple config loading
        const configService = new ConfigurationServiceImpl(
            path.join(process.cwd(), 'config', 'config.json'),
            path.join(process.cwd(), 'config', 'openapi.json'),
            validationService
        );

        const config = await configService.getConfiguration();

        const {mongodb} = config;
        await mongoose.connect(`mongodb://${mongodb.auth.username}:${mongodb.auth.password}@${mongodb.host}:${mongodb.port ||
                                                                                                              27017}/lecturedb?authSource=admin`,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false,
                useCreateIndex: true
            });

        const courseService = new CourseServiceImpl();
        const userService = new UserServiceImpl();
        const authService = new AuthServiceImpl(userService, configService);

        // Nur, damit ich kein extra script schreiben muss.
        if ((await userService.getAllUsers()).length === 0) {
            await Promise.all([
                userService.addUser('001', '001', false),
                userService.addUser('002', '002', true),
                userService.addUser('003', '003', true)
            ]);
        }

        app.set(Constants.ConfigurationService, configService);
        app.set(Constants.SchemaValidationService, validationService);
        app.set(Constants.CourseService, courseService);
        app.set(Constants.UserService, userService);
        app.set(Constants.AuthorizationService, authService);

        const server = http.createServer({}, app);

        app.use(registerRoutes(app));

        app.get('/openapi.json', async (req, res) => {
            res.json(await configService.getOpenAPIDefinition())
        })

        app.use((req, res) => {
            logger.error(`Path ${req.path} not found.`);
            res.status(404);
            res.send();
        });

        // Braucht wohl die Next-Funktion als Parameter um festzustellen, ob das ein Error Handler ist.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        app.use((err: any, req: any, res: any, next: NextFunction) => {
            logger.error('Error during request!', {err});
            res.status(400);
            res.send();
        });
        server.listen(config.port, () => {
            logger.info(`App is listening on port ${config.port}.`);
        });

    } catch (e) {
        logger.error('Could not start app!', {err: e});
    }
}

main().then();

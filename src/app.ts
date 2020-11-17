import express, { Express, NextFunction } from 'express';
import path from 'path';
import expressWinston from 'express-winston';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import Constants from './constants';
import { Configuration } from './types';

import logger from './winston';
import ConfigurationServiceImpl from './services/ConfigService';
import SchemaServiceImpl from './services/SchemaService';
import CourseServiceImpl from './services/CourseService';
import UserServiceImpl from './services/UserService';
import AuthServiceImpl from './services/AuthService';

import registerRoutes from './routes';
import BookingServiceImpl from './services/BookingService';


/**
 * Initialises an app instance, the returns it together with the configuration for starting the http server
 * @returns {Promise<{app: e.Express, config: Configuration}>}
 */
export default async function initApplication(configFolder: string,
                                              schemaFolder: string): Promise<{ app: Express, config: Configuration }> {
    logger.info('Starting');

    const app = express();
    app.use(express.json());
    app.use(cookieParser());

    app.use(expressWinston.logger({winstonInstance: logger}));
    app.use(expressWinston.errorLogger({winstonInstance: logger}));

    app.set(Constants.Logger, logger);

    // Used for request body validation
    const validationService = new SchemaServiceImpl(schemaFolder);
    // Simple config loading
    const configService = new ConfigurationServiceImpl(
        path.join(configFolder, 'config.json'),
        path.join(configFolder, 'openapi.json'),
        validationService
    );

    const config = await configService.getConfiguration();

    const {mongodb: mongodbConfig} = config;
    await mongoose.connect(`mongodb://${mongodbConfig.auth.username}:${
            mongodbConfig.auth.password}@${mongodbConfig.host}:${mongodbConfig.port || 27017}/lecturedb?authSource=admin`,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });

    const userService = new UserServiceImpl();
    const authService = new AuthServiceImpl(userService, configService);
    const bookingService = new BookingServiceImpl();
    const courseService = new CourseServiceImpl(userService);


    app.set(Constants.ConfigurationService, configService);
    app.set(Constants.SchemaValidationService, validationService);
    app.set(Constants.CourseService, courseService);
    app.set(Constants.UserService, userService);
    app.set(Constants.AuthorizationService, authService);
    app.set(Constants.BookingService, bookingService);

    app.use(express.static('web'));

    app.use('/api/v1', registerRoutes(app));

    app.get('/api/v1/openapi.json', async (req, res) => {
        res.json(await configService.getOpenAPIDefinition());
    });

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(undefined, {
        swaggerOptions: {
            url: '/api/v1/openapi.json'
        }
    }));

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

    return {app, config};
}


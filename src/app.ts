import http from 'http';
import express from 'express';
import path from 'path';
import expressWinston from 'express-winston';

import Constants from './constants';

import logger from './winston';
import ConfigurationServiceImpl from './services/ConfigService';
import SchemaServiceImpl from './services/SchemaService';

import registerRoutes from './routes';
import CourseServiceImpl from './services/CourseService';


async function main() {
    try {
        logger.info('Starting')

        const app = express();
        app.use(express.json());

        app.use(expressWinston.logger({winstonInstance: logger}));
        app.use(expressWinston.errorLogger({winstonInstance: logger}));

        app.set(Constants.Logger, logger);

        // Used for request body validation
        const validationService = new SchemaServiceImpl(path.join(process.cwd(), 'schemas'));
        // Simple config loading
        const configService = new ConfigurationServiceImpl(path.join(process.cwd(), 'config', 'config.json'),
            validationService);
        const config = await configService.getConfiguration();
        const courseService = new CourseServiceImpl();

        app.set(Constants.ConfigurationService, configService);
        app.set(Constants.SchemaValidationService, validationService);
        app.set(Constants.CourseService, courseService);

        const server = http.createServer({}, app);

        app.use(registerRoutes(app));

        app.use((req, res) => {
            logger.error(`Path ${req.path} not found.`);
            res.status(404);
            res.send();
        });
        app.use((err: any, req: any, res: any) => {
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

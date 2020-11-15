import http from 'http';
import path from 'path';

import logger from './winston';
import initApplication from './app';


initApplication(path.join(process.cwd(), 'config'), path.join(process.cwd(), 'schemas')).then(({app, config}) => {
    try {
        const server = http.createServer({}, app);
        server.listen(config.port, () => {
            logger.info(`App is listening on port ${config.port}.`);
        });
    } catch (err) {
        logger.error('Could not start app!', {err});
    }
}, (err) => logger.error('Could not start app!', {err}));


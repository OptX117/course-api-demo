import { promises as fs } from 'fs';
import { Configuration, ConfigurationService, SchemaService } from '../types';

import logger from '../winston';


export default class ConfigurationServiceImpl implements ConfigurationService {
    private config?: Configuration;

    private readonly configPath: string;
    private readonly schemaService: SchemaService;

    /**
     * @param {string} configPath The path to load as configuration.<br>Should be <code>path.join(process.cwd(), 'config', 'config.json')</code>, except for testing.
     */
    constructor(configPath: string, schemaService: SchemaService) {
        this.configPath = configPath;
        this.schemaService = schemaService;
    }

    public async getConfiguration(): Promise<Readonly<Configuration>> {
        if (this.config != null) {
            return Object.freeze(this.config);
        } else {
            logger.info('Loading configuration');
            try {
                const possibleConfig = JSON.parse((await fs.readFile(this.configPath)).toString());
                const validationResults = await this.schemaService.validateSchema(possibleConfig, 'config.schema.json');
                if (validationResults.valid) {
                    this.config = possibleConfig;
                } else {
                    logger.error('Error loading config!\n' +
                                 validationResults.errors.map((e: Error) => e.toString()).join('\n'));
                }
            } catch (err) {
                logger.error('Could not load configuration! Falling back to defaults!', {err});
            }

            if (!this.config) {
                this.config = {
                    port: 3000
                };
            }

            return Object.freeze(this.config as Configuration);
        }
    }

}


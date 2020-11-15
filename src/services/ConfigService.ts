import { promises as fs } from 'fs';
import { Configuration, ConfigurationService, SchemaService } from '../types';

import logger from '../winston';


export default class ConfigurationServiceImpl implements ConfigurationService {
    private config?: Configuration;
    private openApiDefinition?: Record<string, unknown>;

    private readonly configPath: string;
    private readonly openApiDefinitionPath: string;
    private readonly schemaService: SchemaService;

    /**
     * @param {string} configPath The path to load as configuration.<br>Should be <code>path.join(process.cwd(), 'config', 'config.json')</code>, except for testing.
     * @param {string} openApiDefinitionPath The path to load as openapi definition<br>Should be <code>path.join(process.cwd(), 'config', 'openapi.json')</code>, except for testing.
     * @param {SchemaService} schemaService The schema service to use for validating the options.json file.
     */
    constructor(configPath: string, openApiDefinitionPath: string, schemaService: SchemaService) {
        this.configPath = configPath;
        this.openApiDefinitionPath = openApiDefinitionPath;
        this.schemaService = schemaService;
    }

    public async getConfiguration(): Promise<Readonly<Configuration>> {
        if (this.config != null) {
            return Object.freeze(this.config);
        } else {
            logger.info(`Loading configuration from path ${this.configPath}.`);
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
                    port: 3000,
                    mongodb: {
                        host: 'localhost',
                        port: 27017,
                        auth: {
                            username: '',
                            password: ''
                        }
                    },
                    jwt: ''
                };
            }

            return Object.freeze(this.config as Configuration);
        }
    }

    public async getOpenAPIDefinition(): Promise<Readonly<Record<string, unknown>>> {
        if (this.openApiDefinition != null) {
            return Object.freeze(this.openApiDefinition);
        } else {
            logger.info(`Loading OpenAPI definition from path ${this.openApiDefinitionPath}.`);
            try {
                return await fs.readFile(this.openApiDefinitionPath).then(res => JSON.parse(res.toString()));
            } catch (err) {
                logger.error('Could not load OpenAPI definition! Returning empty file.', {err});
                return {};
            }

        }

    }

}


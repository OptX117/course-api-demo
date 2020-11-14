import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import sinon, { SinonMock } from 'sinon';
import sinonChai from 'sinon-chai';
import ConfigurationServiceImpl from '../../src/services/ConfigService';
import { Configuration, SchemaService } from '../../src/types';
import path from 'path';
import { ValidationError } from 'jsonschema';

chai.use(sinonChai);

function getSchemaServiceMock() {
    const mock = sinon.mock({
        async validateSchema(): Promise<any> {
            /*ignore*/
        }
    });
    return {mock, service: (mock as any).object as unknown as SchemaService};
}

//Service praktisch nur, damit ich keine type castings machen muss
let schemaServiceMock: { mock: SinonMock, service: SchemaService };

describe('ConfigService', () => {
    beforeEach(() => {
        schemaServiceMock = getSchemaServiceMock();
    });

    it('should load a general config', async () => {
        schemaServiceMock.mock.expects('validateSchema').returns({
            valid: true
        });
        const service = new ConfigurationServiceImpl(path.join(__dirname, 'ConfigServiceFiles', 'config.json'),
            schemaServiceMock.service);
        const config: Configuration = await service.getConfiguration();

        expect(config.port).to.eq(1887, 'Port does not match expected value!');
    });

    it('should load default values on a missing file', async () => {
        schemaServiceMock.mock.expects('validateSchema').returns({
            valid: true
        });
        const service = new ConfigurationServiceImpl(path.join(__dirname, 'ConfigServiceFiles'),
            schemaServiceMock.service);
        const config: Configuration = await service.getConfiguration();

        expect(config.port).to.eq(3000, 'Port does not match expected value!');
    });

    it('should load default values on a wrong file', async () => {
        schemaServiceMock.mock.expects('validateSchema').returns({
            valid: false, errors: [
                new ValidationError('Testerror', schemaServiceMock.service, {}, 'nope', 'Testerror')
            ]
        });

        const service = new ConfigurationServiceImpl(path.join(__dirname, 'ConfigServiceFiles', 'wrongConfig.json'),
            schemaServiceMock.service);
        const config: Configuration = await service.getConfiguration();

        expect(config.port).to.eq(3000, 'Port does not match expected value!');
    });
});

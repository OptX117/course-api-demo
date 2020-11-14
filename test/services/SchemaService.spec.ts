import SchemaServiceImpl from '../../src/services/SchemaService';
import path from 'path';
import { expect } from 'chai';

let service!: SchemaServiceImpl;

const defaultValidationObject = {
    port: 3000
};

function getValidationObject() {
    return JSON.parse(JSON.stringify(defaultValidationObject));
}

describe('SchemaService', () => {
    beforeEach(() => {
        service = new SchemaServiceImpl(path.join(__dirname, 'SchemaServiceFiles'));
    });

    describe('loading a single schema', () => {
        it('should load a single schema by name', async () => {
            const results = await service.validateSchema(getValidationObject(), 'config.schema.json');
            expect(results.valid).to.be.true;
        });
        it('should throw an error if a schema was not found by name', async () => {
            try {
                await service.validateSchema(getValidationObject(), 'not.found.schema.json');
            } catch (err) {
                expect(err.message)
                    .to
                    .include('ENOENT: no such file or directory', 'wrong error thrown on missing file!');
            }
        });
    });

    describe('loading a schema folder', () => {
        it('should load a complete folder by name', async () => {
            const results = await service.validateSchema(getValidationObject(), 'schemaFolder');
            expect(results.valid).to.be.true;
        });

        it('should throw an error if a folder was not found by name', async () => {
            try {
                await service.validateSchema(getValidationObject(), 'folderNotFound');
            } catch (err) {
                expect(err.message)
                    .to
                    .include('ENOENT: no such file or directory', 'wrong error thrown on missing file!');
            }
        });
    });

    // Hier fehlen eigentlich noch Tests für die zusätzlichen Schemas... Aber da die alle gleich sind, die intern die gleiche Logik nutzen & das hier nur Demo ist, lass ich die mal weg :)
});

import { SchemaService, SchemaStore } from '../types';
import path from 'path';
import { promises as fs } from 'fs';
import jsonschema, { ValidatorResult } from 'jsonschema';

export default class SchemaServiceImpl implements SchemaService {
    private readonly schemaDir: string;
    private readonly schemaStore: SchemaStore;
    private readonly schemas: SchemaStore = {};

    constructor(schemaDir: string) {
        this.schemaDir = schemaDir;

        const readDir = this.readDir.bind(this);
        const readSchema = this.readSchema.bind(this);
        this.schemaStore = new Proxy(this.schemas, {
            get(target: SchemaStore, p: PropertyKey): any {
                if (Reflect.has(target, p)) {
                    return Promise.resolve(Reflect.get(target, p));
                } else if (typeof p === 'string') {
                    if (path.extname(p).length === 0) {
                        return readDir(p).then((ret) => {
                            (target[path.basename(p)] as any) = ret.map(d => d.schema);
                            ret.forEach(d => target[d.name] = d.schema);
                            return ret.map(d => d.schema);
                        });
                    } else {
                        return readSchema(p).then((ret) => {
                            target[p] = ret;
                            return ret;
                        });
                    }
                }
            }
        });
    }

    public async validateSchema(obj: Record<string, unknown>, schemaName: string,
                                additionalSchemas?: string[]): Promise<ValidatorResult> {
        return this.schemaStore[schemaName]
            .then(parsed => Promise.all([Promise.resolve(parsed), ...(additionalSchemas ||
                []).map(s => this.schemaStore[s])]))
            .then(schemas => schemas.reduce((previousValue, currentValue) => {
                previousValue.push(...(Array.isArray(currentValue) ? currentValue : [currentValue]));
                return previousValue;
            }, [] as any[]))
            .then(schemas => {
                const [mainSchema] = schemas;
                const additionalSchemas = schemas.slice(1);
                const v = new jsonschema.Validator();
                for (const additionalSchema of additionalSchemas) {
                    if (additionalSchema['$id'] == null) {
                        throw new Error('Schema without ID found!');
                    }
                    v.addSchema(additionalSchema, additionalSchema['$id']);
                }
                return v.validate(obj, mainSchema);
            });
    }

    /**
     * Reads a complete directory and loads all available schemas within it
     * @param {string} name The name of the directory
     * @returns {Promise<{name: string, schema: any}[]>} Resolves with a list of schemas
     * @private
     */
    private readDir(name: string): Promise<{ name: string, schema: any }[]> {
        const dir = path.isAbsolute(name) ? name : path.join(this.schemaDir, name);
        return fs.readdir(dir)
            .then(dirInfo => Promise.all(dirInfo
                .filter(s => path.extname(s).length > 0)
                .map(async fileName => ({
                    name: fileName,
                    schema: await fs.readFile(path.join(dir, fileName)).then(buff => JSON.parse(buff.toString()))
                })))
            );
    }

    /**
     * Read a single schema
     * @param {string} name The name of the schema
     * @returns {Promise<any>} Resolves with the content of the schema
     * @private
     */
    private readSchema(name: string): Promise<any> {
        return fs.readFile(path.join(this.schemaDir, name)).then(buff => JSON.parse(buff.toString()));
    }

}

import { FormField } from "./form-field";
import { FormFieldPrepare } from './form-field-prepare';

export class Form {
    private _fields: { [field: string]: FormField } = {};
    public get fields() { return this._fields ? this._fields : {}; };

    constructor(fields: { [field: string]: Partial<FormFieldPrepare> }){
        if (fields && Object.keys(fields).length > 0) {
            for(let field in fields) {
                let formField = new FormField();
                formField.setValue(fields[field].value);
                this._fields[field] = formField;
            }
        }
    }

    public get(field: string): FormField {
        if (field in this.fields)
            return this.fields[field];
        else {
            console.error(`The field "${field}" not found.`);
            return new FormField({});
        }
    }

    public get value(): any {
        let value = {} as any;
        for(let field in this._fields) {
            value[field] = this.get(field).value;
        }
        return value;
    }
}
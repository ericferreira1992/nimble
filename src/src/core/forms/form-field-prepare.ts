import { FormField } from "./form-field";

export class FormFieldPrepare {
    value: any;
    validators?: ((formField: FormField) => any)[];

    constructor(obj: Partial<FormFieldPrepare>){
        Object.assign(this, obj);
    }
}
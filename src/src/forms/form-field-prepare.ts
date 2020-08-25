import { FormField } from "./form-field";

export class FormFieldPrepare {
    public value: any;
    public validators?: ((formField: FormField) => any)[];

    constructor(obj: Partial<FormFieldPrepare>){
        Object.assign(this, obj);
    }
}
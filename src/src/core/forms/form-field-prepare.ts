export class FormFieldPrepare {
    value: any;

    constructor(obj: Partial<FormFieldPrepare>){
        Object.assign(this, obj);
    }
}
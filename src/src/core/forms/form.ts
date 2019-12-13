import { FormField } from "./form-field";
import { FormFieldPrepare } from './form-field-prepare';
import { NimbleApp } from "../../app";
import { Router } from "../../route";
import { ListenersCollector } from "../../providers/listeners-collector";

export class Form {

    private _fields: { [field: string]: FormField } = {};
    public get fields() { return this._fields ? this._fields : {}; };

    public _formElement: HTMLFormElement;
    public get formElement(){ return this._formElement; }
    public set formElement(value: HTMLFormElement){
        this._formElement = value;
        this.setFormListeners();
    }

    public _submitted: boolean = false;
    public get submitted(){ return this._submitted; }

    public get isValid() { return Object.keys(this.fields).every(field => this.fields[field].isValid); }

    private get listenerCollector() { return NimbleApp.inject(ListenersCollector); }

    constructor(fields: { [field: string]: Partial<FormFieldPrepare> }){
        if (fields && Object.keys(fields).length > 0) {
            for(let field in fields) {
                let formField = new FormField();
                formField.parent = this;
                formField.setValidators(fields[field].validators);
                formField.setValue(fields[field].value, { noNotify: true, noUpdateElement: true });
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

    public reset(options?: { noNotify?: boolean, noUpdateElement?: boolean }) {
        for(let fieldName in this.fields) {
            let field = this.fields[fieldName];
            field.reset(options);
        }
    }

    private setFormListeners() {
        this.listenerCollector.subscribe(this.formElement, 'submit', () => {
            this._submitted = true;
            this.validate();
        }, true);
    }

    public validate() {
        let isValid = true;
        for(let fieldName in this.fields) {
            let field = this.fields[fieldName];
            if(!field.validate())
                isValid = false;
        }

        return isValid;
    }
}
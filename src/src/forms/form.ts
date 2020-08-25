import { FormField } from "./form-field";
import { FormFieldPrepare } from './form-field-prepare';
import { NimbleApp } from "../app";
import { ElementListenersCollector } from "../providers/listeners-collector";
import { IScope } from "../page/interfaces/scope.interface";
import { Observer } from "../core/observer";

export class Form {

    public onSubmit: Observer<Event> = new Observer();

    private _fields: { [field: string]: FormField } = {};
    public get fields() { return this._fields ? this._fields : {}; };

    private _formElement: HTMLFormElement;
    public get formElement(){ return this._formElement; }
    public set formElement(value: HTMLFormElement){
        this._formElement = value;
        this.setFormListeners();
    }

    private _renderOnInteract: boolean = true;
    public get renderOnInteract(){ return this._renderOnInteract; }
    public set renderOnInteract(value: boolean){ this._renderOnInteract = value; }

    private _scope: IScope;
    public get scope(){ return this._scope; }
    public set scope(value: IScope){ this._scope = value; }

    private _submitted: boolean = false;
    public get submitted(){ return this._submitted; }

    private _isSubmitting: boolean = false;
	public get isSubmitting(){ return this._isSubmitting; }
	
    public get isEnabled() { return Object.keys(this._fields).every(x => this._fields[x].isEnabled); }
    public get isDisabled() { return Object.keys(this._fields).every(x => this._fields[x].isDisabled); }

    /** Indicates that you have already entered at least one field and left. */
    public get blurred() { return Object.keys(this._fields).some(x => this._fields[x].blurred); }

    /** Indicates that you have already entered at least one field. */
    public get touched() { return Object.keys(this._fields).some(x => this._fields[x].touched); }

    public get errors(): { [name: string]: any } | null {
        let errors = {} as any;
        for (let fieldName in this._fields) {
            let field = this._fields[fieldName];
            if (field.errors) {
                let errosName = Object.keys(field.errors);
                for (let errorName of errosName) {
                    if (!(errorName in errors))
                        errors[errorName] = field.errors[errorName];
                }
            }
        }
        return JSON.stringify(errors) === '{}' ? null : errors;
    }

    /**Check if all validators from fields is valid and returns a boolean */
    public get isValid() {
        let fieldsName = Object.keys(this.fields);
        return fieldsName.length === 0 || fieldsName.every(name => this.fields[name].isValid);
    }

    private get listenerCollector() { return NimbleApp.inject(ElementListenersCollector); }

    private _isReseting: boolean;
    public get isReseting(){ return this._isReseting; }

    constructor(fields: { [field: string]: Partial<FormFieldPrepare> }){
        if (fields && Object.keys(fields).length > 0) {
            for(let field in fields) {
                let formField = new FormField();
                formField.parent = this;
                formField.setValidators(fields[field].validators);
                formField.setValue(fields[field].value, { noNotify: true, noUpdateElement: true, noValidate: true });
                this._fields[field] = formField;
            }
        }
    }

    /**Returns form-field by name */
    public get(fieldName: string): FormField {
        if (fieldName in this.fields)
            return this.fields[fieldName];
        else {
            console.error(`The field "${fieldName}" not found.`);
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

    public has(fieldName: string): boolean {
        return !!(this.fields && Object.keys(this.fields).some(name => name === fieldName));
    }

    public hasErrors() {
        let errors = this.errors;
        return !!(errors && Object.keys(errors).length > 0);
    }

    /**Reset all fields value and clear touched and blurred properties. */
    public reset(options?: { noNotify?: boolean, noUpdateElement?: boolean }) {
        try {
            this._isReseting = true;
            for(let fieldName in this.fields) {
                let field = this.fields[fieldName];
                field.reset(options);
            }
        }
        finally {
            this._isReseting = false;
            this.renderIfNeed();
            return this;
        }
    }

    /**Validates all form and returns a boolean */
    public validate() {
        let isValid = true;
        for(let fieldName in this.fields) {
            let field = this.fields[fieldName];
            if(!field.validate())
                isValid = false;
        }

        return isValid;
    }

    public setTouched() {
        for(let fieldName in this.fields)
            this.fields[fieldName].setTouched();
    }
    public setUntouched() {
        for(let fieldName in this.fields)
            this.fields[fieldName].setUntouched();
    }

    public setBlurred() {
        for(let fieldName in this.fields)
            this.fields[fieldName].setBlurred();
    }
    public setUnblurred() {
        for(let fieldName in this.fields)
            this.fields[fieldName].setUnblurred();
    }

    public disable() {
        for(let fieldName in this.fields)
            this.fields[fieldName].disable();
	}
    public enable() {
        for(let fieldName in this.fields)
            this.fields[fieldName].enable();
	}

    private setFormListeners() {
        this.listenerCollector.subscribe(this.formElement, 'submit', (e: Event) => {
            this._isSubmitting = true;
            this._submitted = true;
            this.validate();

            this.onSubmit.notify(e);
            
            this.renderIfNeed();
            this._isSubmitting = false;
        }, true);
    }

    private renderIfNeed() {
        if (this.renderOnInteract && this.scope) {
            this.scope.onNeedRerender && this.scope.onNeedRerender(this.scope);
        }
    }
}
import { NimbleApp } from "../../app";
import { Form } from "./form";
import { ListenersCollector } from "../../providers/listeners-collector";
import { Observer } from "../observer";
import { isObject } from "util";

export class FormField {
    public parent: Form;

    private _elements: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = [];
    public get elements() { return this._elements; }

    private _value: any;
    public get value() { return this._value; }

    private _valueChanges: Observer<any> = new Observer<any>();
    public get valueChanges() { return this._valueChanges; }

    private _errors: { [name: string]: any } = null;
    public get errors() { return this._errors; }

    private _validators: ((formField: FormField) => any)[] = [];
    public get validators() { return this._validators; }

    private _blurred: boolean = false;
    /** Indicates that you have already entered the field and left. */
    public get blurred() { return this._blurred; }

    private _touched: boolean = false;
    /** Indicates that you have already entered the field. */
    public get touched() { return this._touched; }

    public get isValid() { return !this.errors || Object.keys(this.errors).filter(x => !(this.errors[x] === false)).length === 0; }

    private get listenerCollector() { return NimbleApp.inject(ListenersCollector); }

    constructor(obj?: Partial<FormField>){
        Object.assign(this, obj);
    }

    public setValue(value: any, options: { noNotify?: boolean, noUpdateElement?: boolean, noValidate?: boolean } = {} as any) {
        this._value = value;
        if ((!options || !options.noUpdateElement) && this.elements.length === 1) {
            let element = this.elements[0];
            if (element.type !== 'checkbox' && element.type !== 'radio'){
                element.value = value; 
                element.dispatchEvent(new Event('input', {
                    bubbles: false,
                    cancelable: true,
                }));
            }
        }
        
        if (!options || !options.noNotify)
            this.valueChanges.notify(value);
        
        if (!options || !options.noValidate && (!this.parent || this.parent.submitted))
            this.validate();
    }

    public validate(): boolean {
        let errors = {} as any;
        for(let validator of this.validators) {
            if (validator) {
                let error = validator(this);
                if (isObject(error) && Object.keys(error).some(x => error[x]))
                    Object.keys(error).forEach((prop) => {
                        if (error[prop])
                            errors[prop] = error[prop];
                    });
            }
        }
        this._errors = JSON.stringify(errors) === '{}' ? null : errors;
        return this.isValid;
    }

    public hasError(name: string) {
        return this.errors && this.errors[name];
    }

    public setElement(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
        if (this._elements.indexOf(element) < 0) {
            this._elements.push(element);
            this.setFieldElementListeners(element);
        }
    }

    public setErrors(errors: { [name: string]: boolean }) {
        this._errors = errors;
    }

    public setValidators(validators: ((formField: FormField) => any)[]) {
        if (validators)
            for(let validator of validators) {
                if (!this._validators.some(x => x === validator))
                    this._validators.push(validator);
            };
    }

    public removeValidators(validators: ((formField: FormField) => any)[]) {
        if (validators)
            this._validators = this._validators.filter(x => !validators.some(y => x === y));
    }

    public reset(options?: { noNotify?: boolean, noUpdateElement?: boolean }) {
        this.setValue(null, options);
        this._errors = null;
    }

    private setFieldElementListeners(element: HTMLElement) {
        this.listenerCollector.subscribe(element, 'focus', () => {
            this._touched = true;
        }, true);
        this.listenerCollector.subscribe(element, 'blur', () => {
            this._blurred = true;
        }, true);
    }
}
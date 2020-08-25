import { NimbleApp } from "../app";
import { Form } from "./form";
import { ElementListenersCollector } from "../providers/listeners-collector";
import { Observer } from "../core/observer";
import { isObject } from "util";

export class FormField {
    public parent: Form;

    private _elements: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = [];
    public get elements() { return this._elements; }

    private _value: any;
    public get value() { return this._value; }

    private _valueChanges: Observer<any> = new Observer<any>();
    public get valueChanges() { return this._valueChanges; }

    private _errors: { [name: string]: any } | null = null;
    public get errors() { return this._errors; }

    private _validators: ((formField: FormField) => any)[] = [];
    public get validators() { return this._validators; }

    private _isEnabled: boolean = true;
    public get isEnabled() { return this._isEnabled; }
    public get isDisabled() { return !this._isEnabled; }

    private _blurred: boolean = false;
    /** Indicates that you have already entered the field and left. */
    public get blurred() { return this._blurred; }

    private _touched: boolean = false;
    /** Indicates that you have already entered the field. */
    public get touched() { return this._touched; }

    /**Check if all validators is valid and returns a boolean */
    public get isValid() { return !this.errors || Object.keys(this.errors).filter(x => !(this.errors[x] === false)).length === 0; }

    private get listenerCollector() { return NimbleApp.inject(ElementListenersCollector); }

    constructor(obj?: Partial<FormField>){
        Object.assign(this, obj);
    }

    public setValue(value: any, options: { noNotify?: boolean, noUpdateElement?: boolean, noValidate?: boolean } = {} as any) {
        let interacted = false;
        this._value = value;
        if ((!options || !options.noUpdateElement) && this.elements.length === 1) {
            let element = this.elements[0];
            if (element.type !== 'checkbox' && element.type !== 'radio'){
                element.value = value; 
                if (element.value === value) {
                    element.dispatchEvent(new Event('input', {
                        bubbles: false,
                        cancelable: true,
                    }));
                }
            }
        }
        
        if (!options || !options.noNotify) {
            this.valueChanges.notify(value);
            interacted = true;
        }
        
        if (!options || !options.noValidate) {
			if (this.parent) {
				for(let fieldProp in this.parent.fields) {
					if (this.parent.fields[fieldProp]?.touched) {
						this.parent.fields[fieldProp]?.validate();
					}
				}
			}
            else {
				this.validate();
			}
            interacted = true;
        }

        if (interacted && (!this.parent || !this.parent.isReseting))
            this.renderIfNeed();
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
        return !!(this.errors && this.errors[name]);
    }

    public hasErrors() {
        return !!(this.errors && Object.keys(this.errors).length > 0);
    }

    public setElement(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
		if (element) {
			if (this._elements.indexOf(element) < 0) {
				this._elements.push(element);
			}
			this.setFieldElementListeners(element);
		}
    }

    public setErrors(errors: { [name: string]: boolean }) {
        this._errors = errors;
    }

    public setValidators(validators: ((formField: FormField) => any)[]) {
        if (validators) {
			this._validators = [];
            for(let validator of validators) {
                if (!this._validators.some(x => x === validator))
                    this._validators.push(validator);
            };
		}
    }

    public setTouched() { this._touched = true; }
    public setUntouched() { this._touched = false; }

    public setBlurred() { this._blurred = true; }
    public setUnblurred() { this._blurred = false; }

    public disable() { this._isEnabled = false; }
    public enable() { this._isEnabled = true; } 

    public removeValidators(validators: ((formField: FormField) => any)[]) {
        if (validators)
            this._validators = this._validators.filter(x => !validators.some(y => x === y));
    }

    /**Reset value and clear touched and blurred properties. */
    public reset(options?: { noNotify?: boolean, noUpdateElement?: boolean, noValidate?: boolean }) {
        this.setUntouched();
        this.setUnblurred();
        this.setValue(null, options);
        this._errors = null;
    }

    private setFieldElementListeners(element: HTMLElement) {
        this.listenerCollector.subscribe(element, 'focus', () => {
            this._touched = true;
            
            if (this.blurred)
                this.validate();

            this.renderIfNeed()
        }, true, { once: true });
        
        this.listenerCollector.subscribe(element, 'blur', () => {

            this._blurred = true;
            this.validate();

            this.renderIfNeed();
        }, true, { once: true });
    }

    private renderIfNeed() {
        if (this.parent && this.parent.renderOnInteract && this.parent.scope && !this.parent.isSubmitting) {
            this.parent.scope.onNeedRerender && this.parent.scope.onNeedRerender(this.parent.scope);
        }
    }
}
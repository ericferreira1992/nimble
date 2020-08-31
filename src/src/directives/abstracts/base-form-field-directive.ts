import { Directive } from "./directive";
import { FormField } from "../../forms/form-field";
import { Form } from "../../forms/form";

export abstract class BaseFormFieldDirective extends Directive {

    public form: Form;

    protected get formField(): FormField {
		let directive = (this.selector === 'form-field' || this.selector === 'form-field-name')
			? this
			: this.others.find(x => x.selector === 'form-field' || x.selector === 'form-field-name');

		let value = directive?.value;
        if (value) {
			if (value instanceof FormField)
				return value;
			else
				return this.form && this.form.get(value);
        }   
        return null;
    }

    constructor() {
        super();
    }
    
    protected checkForm() {
        if (!this.form || !(this.form instanceof Form)) {
            let selector = this.selectors[0];
            console.error(`The "${selector}" directive not apply beacuse directive [form] not setted in form element, but you can do like it: <form [form]="yourForm" ...>`);
            return false;
        }

        return true;
    }
}
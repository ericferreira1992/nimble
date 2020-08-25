import { Directive } from "./directive";
import { FormField } from "../../forms/form-field";
import { Form } from "../../forms/form";

export abstract class BaseFormFieldDirective extends Directive {

    public form: Form;

    protected get formField(): FormField {
        let directive = this.getDirectiveBySelector('[form-field]') || this.getDirectiveBySelector('form-field-name') || this;
        if (directive) {
            let applied = directive.selectorsApplied.find(x => x.selector === '[form-field]') ||
                          directive.selectorsApplied.find(x => x.selector === 'form-field-name');
            if (applied && (applied.content instanceof FormField || typeof applied.content === 'string')) {
                if (applied.content instanceof FormField)
                    return applied.content;
                else
                    return this.form && this.form.get(applied.content);
            }
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
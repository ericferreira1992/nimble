import { Directive } from "./directive";
import { FormField } from "../../core/forms/form-field";
import { Form } from "../../core/forms/form";
import { FormFieldDirective } from "../forms/form-field.directive";

export abstract class BaseFormFieldDirective extends Directive {

    public form: Form;

    protected get formField(): FormField {
        let directive = this.getDirectiveBySelector('[form-field]') || this;
        if (directive) {
            let applied = directive.selectorsApplied.find(x => x.selector === '[form-field]');
            if (applied) return applied.content;
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
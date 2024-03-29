import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { FormField } from '../../forms/form-field';
import { InternalObserversCollector } from '../../providers/internal-observers-collector';
import { isArray, isBoolean, isUndefined } from 'util';
import { BaseFormFieldDirective } from '../abstracts/base-form-field-directive';
import { ElementListenersCollector } from '../../providers/listeners-collector';

@PrepareDirective({
    selector: [
        '[form-field]',
        'form-field-name',
    ],
    outputs: [
        'valuechange'
    ]
})
export class FormFieldDirective extends BaseFormFieldDirective {

    constructor(
        private listenerCollector: ElementListenersCollector,
        private internalEventsCollector: InternalObserversCollector
    ) {
        super();
    }

    public onRender(): void {
        if (this.checkForm()) {
            if (this.elementIsValid() && (this.value instanceof FormField || this.formFieldNameSelectorIsValid())) {
                this.formField.setElement(this.element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
                if (this.canApplyFormField()) {
                    this.resolveFormFieldSelector();
                    this.resolveFormFieldSpecifications()
                }
            }
            this.resolveValueChangeOutput();
        }
    }
	
	public onChange(): void {
		if (['form-field', 'form-field-name'].some(x => x === this.selector)) {
			if (this.elementIsValid() && (this.value instanceof FormField || this.formFieldNameSelectorIsValid())) {
				this.resolveFormFieldSpecifications();
			}
		}
	}

    public onDestroy() {
    }

    private formFieldNameSelectorIsValid() {
        if(typeof this.value !== 'string') {
            console.error('Some form-field-name directive cannot be appplied, because the it value must be a string.');
            return false;
        }
        if(!this.form.has(this.value)) {
            console.error(`The form-field-name directive cannot be appplied, because the "${this.value}" field not exists in the form.`);
            return false;
        }

        return true;
	}
	
	private resolveFormFieldSpecifications() {
		if (this.formField) {
			if (this.formField.isEnabled) {
				this.element?.removeAttribute('disabled');
			}
			else {
				this.element?.setAttribute('disabled', 'true');
			}
		}
	}

    private resolveFormFieldSelector() {
        let field = this.formField;
        let input = this.element as HTMLInputElement;

        if (input.type === 'radio') {
            if (input.value === field.value || (!input.value && !field.value))
                input.checked = true;

            this.listenerCollector.subscribe(this.element, 'click', (e) => {
                if (this.formField.isEnabled) {
                    field.elements.forEach((el: HTMLInputElement) => {
                        if (el !== input)
                            el.checked = false;
                    });
                    input.checked = true;
                    field.setValue(input.value);
                }
            }, true);
        }
        else if (input.type === 'checkbox') {
            let value: any = input.hasAttribute('value') ? input.value : '';

            if (!isBoolean(field.value))
                input.checked = (value === field.value) || (isArray(field.value) && field.value.some(x => x === value));
            else
                input.checked = field.value;

            this.listenerCollector.subscribe(this.element, 'click', (e) => {
                if (this.formField.isEnabled) {
                    if (field.elements.length === 1) {
                        if (!isBoolean(field.value))
                            field.setValue(input.checked ? value : '');
                        else
                            field.setValue(input.checked);
                    }
                    else {
                        if (field.elements.every(x => x.hasAttribute('value'))) {
                            let values = isArray(field.value) ? field.value : [field.value];
                            if (input.checked)
                                values.push(value);
                            else
                                values = values.filter(x => x !== value);

                            field.setValue(values);
                        }
                        else {
                            console.error('The [form-field] input of type "checkbox" must contain the attribute "value"');
                        }
                    }
                }
            }, true);
        }
        else {
            input.value = !isUndefined(field.value) ? field.value : null;
            this.listenerCollector.subscribe(input, 'input', (e) => {
                if (this.formField.isEnabled) {
					let value: any = input.value;

					if (input.type === 'number')
						value = !isNaN(parseInt(value)) ? parseInt(value) : null;

					field.setValue(value, { noUpdateElement: true });
				}
            }, true);
        }
    }

    private resolveValueChangeOutput() {
        if (this.outputs.valuechange) {
            if (this.formField) {
                this.internalEventsCollector.add(this.scope, '(valueChanges)', this.formField.valueChanges.subscribe((value) => {
                    this.outputs.valuechange(value);
                }));
            }
            else {
                console.error('The directive (valueChanges) cannot be appplied, because the [form-field] directive must exist before it.');
            }
        }
    }

    private canApplyFormField() {
        return !this.others.some(x => x instanceof BaseFormFieldDirective);
    }

    private elementIsValid() {
        return [
            HTMLInputElement,
            HTMLTextAreaElement,
            HTMLSelectElement
        ].some(type => this.element instanceof type);
    }

}
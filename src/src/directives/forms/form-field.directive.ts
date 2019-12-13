import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { FormField } from '../../core/forms/form-field';
import { Listener } from '../../render/listener';
import { InternalObserversCollector } from '../../providers/internal-observers-collector';
import { isArray, isBoolean, isNumber, isNullOrUndefined, isUndefined } from 'util';
import { BaseFormFieldDirective } from '../abstracts/base-form-field-directive';

@PrepareDirective({
    selector: [
        '[form-field]',
        '(valueChange)'
    ]
})
export class FormFieldDirective extends BaseFormFieldDirective {

    constructor(
        private listener: Listener,
        private intervalEventsCollector: InternalObserversCollector

    ) {
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        if (this.checkForm()) {
            if (selector === '[form-field]') {
                if (this.elementIsValid() && value instanceof FormField) {
                    if (this.canApplyFormField()) {
                        value.setElement(element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
                        this.resolveFormFieldSelector(value);
                    }
                }
            }
            else if (selector === '(valueChange)')
                this.resolveValueChangeSelector(value, scope);
        }
    }

    private resolveFormFieldSelector(field: FormField) {
        let input = this.element as HTMLInputElement;
        
        if (input.type === 'radio') {
            if (input.value === field.value || (!input.value && !field.value))
                input.checked = true;

            this.listener.listen(this.element, 'click', (e) => {
                if (!input.disabled) {
                    field.elements.forEach((el: HTMLInputElement) => {
                        if (el !== input)
                            el.checked = false;
                    });
                    input.checked = true;
                    field.setValue(input.value);
                }
            });
        }
        else if (input.type === 'checkbox') {
            let value: any = input.hasAttribute('value') ? input.value : '';

            if (!isBoolean(field.value))
                input.checked = (value === field.value) || (isArray(field.value) && field.value.some(x => x === value));
            else
                input.checked = field.value;

            this.listener.listen(this.element, 'click', (e) => {
                if (!input.disabled) {
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
    
                            field.setValue(values.length > 0 ? value : null);
                        }
                        else {
                            console.error('The form-field input of type "checkbox" must contain the attribute "value"');
                        }
                    }
                }
            });
        }
        else {
            input.value = !isUndefined(field.value) ? field.value : null;
            this.listener.listen(input, 'input', (e) => {
                let value: any = input.value;

                if (input.type === 'number')
                    value = !isNaN(parseInt(value)) ? parseInt(value) : null;

                field.setValue(value, { noUpdateElement: true });
            });
        }
    }

    private resolveValueChangeSelector(expression: any, scope: IScope) {
        if (this.formField) {
            this.intervalEventsCollector.add(scope, '(valueChanges)', this.formField.valueChanges.subscribe((value) => {
                Object.assign(scope, { $event: value });
                scope.eval(expression);
                delete scope['$event'];
            }));

        }
        else {
            console.error('The directive (valueChanges) cannot be appplied, because the [form-field] directive must exist before it.');
        }
    }

    private canApplyFormField() {
        return !this.others.some(x => x instanceof BaseFormFieldDirective);
    }

    private elementIsValid() {
        let types = [
            HTMLInputElement,
            HTMLTextAreaElement,
            HTMLSelectElement,
        ];
        return types.some(type => this.element instanceof type);
    }

}
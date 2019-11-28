import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { FormField } from '../../forms/form-field';

@PrepareDirective({
    selector: [
        '[form-field]',
        '(valueChange)'
    ]
})
export class FormFieldDirective extends Directive {

    private formField: FormField;

    public static get selectorsMustHavePureValue() {
        return [];
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        if (selector === '[form-field]') {
            if(this.elementIsValid(element) && value instanceof FormField) {
                value.element = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                this.formField = value;
                this.resolveFormFieldSelector(value, element, scope);
            }
        }
        else if (selector === '(valueChange)')
            this.resolveValueChangeSelector(value, element, scope);
    }

    private resolveFormFieldSelector(field: FormField, element: HTMLElement, scope: IScope) {
        field.setValue(field.value, { noNotify: true });
        element.addEventListener('input', (e) => {
            field.setValue((element as HTMLInputElement).value);
        });
    }

    private resolveValueChangeSelector(expression: any, element: HTMLElement, scope: IScope) {
        if (this.formField) {
            this.formField.valueChanges.subscribe((value) => {
                Object.assign(scope, { $event: value });
                scope.eval(expression);
                delete scope['$event'];
            });
        }
    }

    private elementIsValid(element: HTMLElement) {
        let types = [
            HTMLInputElement,
            HTMLTextAreaElement,
            HTMLSelectElement,
        ];
        return types.some(type => element instanceof type);
    }

}
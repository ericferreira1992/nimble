import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { FormField } from '../../core/forms/form-field';
import { Listener } from '../../render/listener';

@PrepareDirective({
    selector: [
        '[form-field]',
        '(valueChange)'
    ]
})
export class FormFieldDirective extends Directive {

    private get formField(): FormField {
        let selectorApplied = this.selectorsApplied.find(x => x.selector === '[form-field]');
        if (selectorApplied) return selectorApplied.content;
        return null;
    }

    constructor(
        private listener: Listener

    ){
        super();
    }

    public static get selectorsMustHavePureValue() {
        return [];
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        if (selector === '[form-field]') {
            if(this.elementIsValid() && value instanceof FormField) {
                value.element = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                this.resolveFormFieldSelector(value);
            }
        }
        else if (selector === '(valueChange)')
            this.resolveValueChangeSelector(value, scope);
    }

    private resolveFormFieldSelector(field: FormField) {
        field.setValue(field.value, { noNotify: true });
        this.listener.listen(this.element, 'input', (e) => {
            field.setValue((this.element as HTMLInputElement).value);
        });
    }

    private resolveValueChangeSelector(expression: any, scope: IScope) {
        if (this.formField) {
            this.formField.valueChanges.subscribe((value) => {
                Object.assign(scope, { $event: value });
                scope.eval(expression);
                delete scope['$event'];
            });
        }
        else {
            console.error('The directive (valueChanges) cannot be appplied, because the [form-field] directive must exist before it.');
        }
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
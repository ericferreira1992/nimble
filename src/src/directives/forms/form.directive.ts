import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Form } from '../../core';
import { ListenersCollector } from '../../providers/listeners-collector';

@PrepareDirective({
    selector: [
        '[form]'
    ]
})
export class FormDirective extends Directive {

    public get form() { return this.selectorsApplied[0].content as Form; }

    constructor(
        private listenersCollector: ListenersCollector
    ) {
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        if (this.isValid()) {
            this.form.formElement = element as HTMLFormElement;
        }
    }

    private isValid() {
        if (!(this.element instanceof HTMLFormElement)) {
            console.error(`The directive "${this.selectors[0]}" only applies in form elements.`);
            return false;
        }

        if (!(this.form instanceof Form)) {
            console.warn(`The directive "${this.selectors[0]}" works only with Form as value. Example: <form [form]="myForm">...`);
            return false;
        }

        return true;
    }

}
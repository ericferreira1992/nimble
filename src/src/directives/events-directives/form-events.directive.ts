import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Listener } from '../../render/listener';
import { Form } from '../../core/forms/form';

@PrepareDirective({
    selector: [
        '(blur)',
        '(change)',
        '(contextmenu)',
        '(focus)',
        '(input)',
        '(invalid)',
        '(reset)',
        '(search)',
        '(select)',
        '(submit)',
    ]
})
export class FormEventsDirective extends Directive {

    private get form(): Form {
        let directive = this.getDirectiveBySelector('[form]') || this;
        if (directive) {
            let applied = directive.selectorsApplied.find(x => x.selector === '[form]');
            if (applied) return applied.content;
        }
        return null;
    }

    constructor(
        private listener: Listener
    ){
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        selector = this.pureSelector(selector);
        if (selector === 'submit') {
            this.resolveSubmitSelector(value, element, scope);
        }
        else
            this.listener.listen(element, selector, (e) => {
                Object.assign(scope, { $event: e });
                scope.eval(value);
                delete scope['$event'];
            });
    }

    private resolveSubmitSelector(value: any, element: HTMLElement, scope: IScope) {
        if (this.checkForm('submit'))
            this.listener.listen(element, 'submit', (e) => {
                Object.assign(scope, { $event: e });
                scope.eval(value);
                delete scope['$event'];

                e.preventDefault();
                return false;
            });
    }
    
    private checkForm(selector: string) {
        if (!this.form || !(this.form instanceof Form)) {
            console.error(`The "${selector}" directive not apply beacuse directive [form] not setted in form element, but you can do like it: <form [form]="yourForm" ...>`);
            return false;
        }

        return true;
    }

}
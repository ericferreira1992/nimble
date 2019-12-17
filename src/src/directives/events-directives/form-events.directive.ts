import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Listener } from '../../render/listener';
import { Form } from '../../core/forms/form';

@PrepareDirective({
    selector: [
        '(blur)',
        '(focus)',
        '(input)',
        '(select)',
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
        this.listener.listen(element, selector, (e) => {
            Object.assign(scope, { $event: e });
            scope.eval(value);
            delete scope['$event'];
        });
    }

    public onDestroy(selector: string, scope: IScope) {
    }
    
    private checkForm(selector: string) {
        if (!this.form || !(this.form instanceof Form)) {
            console.error(`The "${selector}" directive not apply beacuse directive [form] not setted in form element, but you can do like it: <form [form]="yourForm" ...>`);
            return false;
        }

        return true;
    }

}
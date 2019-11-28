import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';

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

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        selector = this.pureSelector(selector);
        if (selector === 'submit')
            element.addEventListener(selector, (e) => {
                Object.assign(scope, { $event: e });
                scope.eval(value);
                delete scope['$event'];

                e.preventDefault();
                return false;
            });
        else
            element.addEventListener(selector, (e) => {
                Object.assign(scope, { $event: e });
                scope.eval(value);
                delete scope['$event'];
            });
    }

}
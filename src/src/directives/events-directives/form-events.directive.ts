import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { ListenersCollector } from '../../providers/listeners-collector';

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

    constructor(
        private listenersCollector: ListenersCollector
    ){
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        selector = this.pureSelector(selector);
        if (selector === 'submit')
            this.listenersCollector.subscribe(element, selector, (e) => {
                Object.assign(scope, { $event: e });
                scope.eval(value);
                delete scope['$event'];

                e.preventDefault();
                return false;
            });
        else
            this.listenersCollector.subscribe(element, selector, (e) => {
                Object.assign(scope, { $event: e });
                scope.eval(value);
                delete scope['$event'];
            });
    }

}
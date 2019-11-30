import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { ListenersCollector } from '../../providers/listeners-collector';

@PrepareDirective({
    selector: [
        '(copy)',
        '(cut)',
        '(past)',
    ]
})
export class ClipboardEventsDirective extends Directive {

    constructor(
        private listenersCollector: ListenersCollector
    ){
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        this.listenersCollector.subscribe(element, this.pureSelector(selector), (e) => {
            Object.assign(scope, { $event: e });
            scope.eval(value);
            delete scope['$event'];
        });
    }

}
import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Listener } from '../../render/listener';

@PrepareDirective({
    selector: [
        '(copy)',
        '(cut)',
        '(past)',
    ]
})
export class ClipboardEventsDirective extends Directive {

    constructor(
        private listener: Listener
    ){
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
            this.listener.listen(element, this.pureSelector(selector), (e) => {
                Object.assign(scope, { $event: e });
                scope.eval(value);
                delete scope['$event'];
            });
    }

}
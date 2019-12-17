import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { Listener } from '../../render/listener';

@PrepareDirective({
    selector: [
        '(keydown)',
        '(keypress)',
        '(keyup)'
    ]
})
export class KeyboardEventsDirective extends Directive {

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

    public onDestroy(selector: string, scope: IScope) {
    }

}
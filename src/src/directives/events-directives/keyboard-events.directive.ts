import { IScope } from '../../page/interfaces/scope.interface';
import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { ElementListener } from '../../render/listener';

@PrepareDirective({
    selector: [
        '(keydown)',
        '(keypress)',
        '(keyup)'
    ]
})
export class KeyboardEventsDirective extends Directive {

    constructor(
        private listener: ElementListener
    ){
        super();
    }

    public onResolve(selector: string, value: any): void {
        this.listener.listen(this.element, this.pureSelector(selector), (e) => {
            Object.assign(this.scope, { $event: e });
            this.scope.compile(value);
            delete this.scope['$event'];
        });
    }

    public onDestroy() {
    }

}
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
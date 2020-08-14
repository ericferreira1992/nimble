import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { ElementListener } from '../../render/listener';

@PrepareDirective({
    selector: [
        '(drag)',
        '(dragend)',
        '(dragenter)',
        '(dragleave)',
        '(dragover)',
        '(dragstart)',
        '(drop)',
        '(scrol)',
    ]
})
export class DragEventsDirective extends Directive {

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
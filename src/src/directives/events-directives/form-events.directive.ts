import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { ElementListener } from '../../render/listener';
import { Form } from '../../forms/form';

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
        private listener: ElementListener
    ){
        super();
    }

    public onResolve(selector: string, value: any): void {
        selector = this.pureSelector(selector);
        this.listener.listen(this.element, selector, (e) => {
            Object.assign(this.scope, { $event: e });
            this.scope.compile(value);
            delete this.scope['$event'];
        });
    }

    public onDestroy() {
    }

}
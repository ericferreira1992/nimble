import { Directive } from '../abstracts/directive';
import { PrepareDirective } from '../decorators/prepare-directive.decor';
import { ElementListener } from '../../render/listener';

@PrepareDirective({
    selector: [
        '(click)',
        '(dblclick)',
        '(mousedown)',
        '(mousemove)',
        '(mouseout)',
        '(mouseover)',
        '(mouseup)',
        '(mousewheel)',
        '(wheel)',
    ]
})
export class MouseEventsDirective extends Directive {

    constructor(
        private listener: ElementListener
    ){
        super();
    }

    public onRender(): void {
        this.listener.listen(this.element, this.selector.replace(/\(|\)/g, ''), (e) => {
            this.outputs[this.selector](e);
        });
    }
	
	public onChange(): void {

	}

    public onDestroy() {
    }

}
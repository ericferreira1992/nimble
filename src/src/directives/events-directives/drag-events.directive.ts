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
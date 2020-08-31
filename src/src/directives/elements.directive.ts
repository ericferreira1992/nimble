import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';
import { Helper } from '../providers/helper';

export const ELEMENT_SELECTORS: string[] = [
    'html',
    'content',
];

@PrepareDirective({
    selector: ELEMENT_SELECTORS
})
export class ElementsDirective extends Directive {

    constructor() {
        super();ElementsDirective
    }

    public onRender(): void {
        if (this.selector === 'html')
            this.resolveHtml();
        else if (this.selector === 'content')
            this.resolveContent();
    }
	
	public onChange(): void {
		this.onRender();
	}

    private resolveHtml() {
        if (this.element.innerHTML.trim() !== (this.value ?? '').trim()) {
            this.element.innerHTML = this.value;
        }
    }

    private resolveContent() {
        if (this.element?.textContent.trim() !== (this.value ?? '').trim()) {
            this.element.textContent = this.value;
        }
    }

    public onDestroy() {
    }
}
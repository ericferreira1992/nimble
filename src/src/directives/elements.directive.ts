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

    constructor(private helper: Helper) {
        super();ElementsDirective
    }

    public resolve(selector: string, value: any): void {
        selector = this.pureSelector(selector);
        let stringValue = value ? value.toString() : '';

        if (selector === 'html')
            this.resolveHtml(stringValue);
        else if (selector === 'content')
            this.resolveContent(stringValue);
    }

    private resolveHtml(value: string) {
        if (this.element.innerHTML.trim() !== value.trim()) {
            this.element.innerHTML = value;
        }
    }

    private resolveContent(value: string) {
        if (this.element?.textContent.trim() !== value.trim()) {
            this.element.textContent = value;
        }
    }

    public onDestroy(selector: string) {
    }
}
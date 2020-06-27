import { IScope } from '../page/interfaces/scope.interface';
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

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        selector = this.pureSelector(selector);
        let stringValue = value ? value.toString() : '';

        if (selector === 'html')
            this.resolveHtml(stringValue, element);
        else if (selector === 'content')
            this.resolveContent(stringValue, element);
    }

    private resolveHtml(value: string, element: HTMLElement) {
        if (element.innerHTML.trim() !== value.trim()) {
            element.innerHTML = value;
        }
    }

    private resolveContent(value: string, element: HTMLElement) {
        if (element.textContent.trim() !== value.trim()) {
            element.textContent = value;
        }
    }

    public onDestroy(selector: string, scope: IScope) {
    }
}
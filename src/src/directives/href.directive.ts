import { IScope } from '../page/interfaces/scope.interface';
import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';
import { Router } from '../route/router';
import { ListenersCollector } from '../providers/listeners-collector';

@PrepareDirective({
    selector: 'href'
})
export class HrefDirective extends Directive {

    constructor(
        private listenersCollector: ListenersCollector
    ){
        super();
    }

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        selector = this.pureSelector(selector);
        if (value && !value.startsWith('http:') && !value.startsWith('https:')) {

            if (Router.useHash && !value.startsWith('#') && !value.startsWith('/#'))
                value = '#/' + value.replace(/^(\/)/g, '');
            else if (!Router.useHash) {
                value = value.replace(/^(#)/g, '');
                this.listenersCollector.subscribe(element, 'click', (e) => {
                    let attr = element.attributes[selector];
                    if (attr)
                        Router.redirect(attr.value);

                    e.preventDefault();
                    return false;
                });
            }
        }

        if (!element.hasAttribute(selector))
            element.setAttribute(selector, value);
        else
            element.attributes[selector].value = value;
    }

    public onDestroy(selector: string, scope: IScope) {
    }

}
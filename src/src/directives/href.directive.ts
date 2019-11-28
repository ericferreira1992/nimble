import { IScope } from '../page/interfaces/scope.interface';
import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';
import { Router } from '../route/router';

@PrepareDirective({
    selector: 'href'
})
export class HrefDirective extends Directive {

    public resolve(selector: string, value: any, element: HTMLElement, scope: IScope): void {
        selector = this.pureSelector(selector);
        if (!value.startsWith('http:') && !value.startsWith('https:')) {

            if (Router.useHash && !value.startsWith('#') && !value.startsWith('/#'))
                value = '#/' + value.replace(/^(\/)/g, '');
            else if (!Router.useHash) {
                value = value.replace(/^(#)/g, '');
                element.addEventListener('click', (e) => {
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

}
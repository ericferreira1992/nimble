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

    public resolve(selector: string, value: any): void {
        selector = this.pureSelector(selector);
        let startsWithHash = value.startsWith('#') || value.startsWith('/#');
        let href = value.replace(/^(#)/g, '');

        if (value && !value.startsWith('http:') && !value.startsWith('https:')) {
            if (Router.useHash) {
                if (!startsWithHash)
                    href = '#/' + href.replace(/^(\/)/g, '');
                else
                    console.error(`The link "#${href}" with "#" not work in useHash mode setted in NimbleApple.`);
            }
            else if (!Router.useHash) {
                if (startsWithHash) {
                    href = `${location.pathname}#${href}`;
                }
                else if (!href.startsWith('/')) {
                    href = `${location.pathname.replace(/(\/)$/g, '')}/${href}`;
                }

                this.listenersCollector.subscribe(this.element, 'click', (e: MouseEvent) => {
                    let attr = this.element.attributes[selector];
                    if (attr) {
                        let href = attr.value
                        setTimeout(() => {
                            Router.redirect(href);
                        });
                    }

                    e.preventDefault();
                });
            }
        }

        if (!this.element.hasAttribute(selector))
			this.element.setAttribute(selector, href);
        else
			this.element.attributes[selector].value = href;
    }

    public onDestroy(selector: string) {
    }

}
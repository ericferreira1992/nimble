import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';
import { Router } from '../route/router';
import { ElementListenersCollector } from '../providers/listeners-collector';
import { NimbleApp } from '../app';

@PrepareDirective({
    selector: 'href'
})
export class HrefDirective extends Directive {

	private get baseHref() { return NimbleApp.instance.baseHref; }
	private get hasBaseHref() { return NimbleApp.instance.hasBaseHref; }

    constructor(
        private listenersCollector: ElementListenersCollector
    ){
        super();
    }

    public onResolve(selector: string, value: any): void {
		selector = this.pureSelector(selector);
		value = value ?? '';
        let startsWithHash = value.startsWith('#') || value.startsWith('/#');
        let href = value.replace(/^(#)/g, '');

        if (!value.startsWith('http:') && !value.startsWith('https:')) {
            if (Router.useHash) {
                if (!startsWithHash)
                    href = '#/' + href.replace(/^(\/)/g, '');
                else
                    console.error(`The link "#${href}" with "#" not work in useHash mode setted in NimbleApple.`);
            }
            else if (href) {
                if (startsWithHash) {
                    href = `${location.pathname}#${href}`;
                }
                else if (!href.startsWith('/')) {
					let prefix = this.baseHref;
                    href = `${prefix.replace(/(\/)$/g, '')}/${href}`;
				}

                this.listenersCollector.subscribe(this.element, 'click', (e: MouseEvent) => {
                    let attr = this.element.attributes[selector];
					let href = attr?.value as string;
                    if (!href || href.startsWith(this.baseHref)) {
                        setTimeout(() => {
                            Router.redirect(href);
                        });
						e.preventDefault();
                    }
                });
			}
			else {
				href = value;
			}
        }

        if (!this.element.hasAttribute(selector))
			this.element.setAttribute(selector, href);
        else
			this.element.attributes[selector].value = href;
    }

    public onDestroy() {
    }

}
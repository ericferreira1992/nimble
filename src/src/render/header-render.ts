import { NimbleApp } from "./../app";
import { Route } from "./../route/route";
import { isNullOrUndefined } from "util";
import { Injectable } from "../inject/injectable";

@Injectable({ single: true })
export class HeaderRender {
    private get app() { return NimbleApp.instance; }

    constructor() {
    }

    public resolveTitleAndMetaTags(route: Route) {
        let page = route.pageInstance;
        
        let titleElement = this.resolveTitle(page.title);

        if (page.meta) {
            let element = this.resolveMetaAndContent('name="description"', page.meta.description, titleElement) ?? titleElement;
            element = this.resolveMetaAndContent('name="keywords"', page.meta.keywords, element);

            if (page.meta.og) {
                let og = page.meta.og;
				let ogProps = Object.keys(page.meta.og)
					.filter(x => !isNullOrUndefined(og[x]) && og[x] !== '')
					.map(x => x.replace(/([A-Z])/g, (v: string) => `_${v.toLowerCase()}`));

				if (page.title) {
					for (let prop of ['title', 'siteName'].filter(prop => !ogProps.some(p => p === prop))) {
						ogProps.push(prop);
						og[prop] = page.title;
					}
				}
				if (!ogProps.some(p => p === 'description') && page.meta.description) {
					ogProps.push('description');
					og['description'] = page.meta.description;
				}

                for (let property of ogProps) {
                    element = this.resolveMetaAndContent(`property="og:${property}"`, og[property], element);
                }
            }
        }
    }

    private resolveTitle(title: string): HTMLElement {
		let titleEl = document.head.querySelector('title');
		if (titleEl) {
			titleEl.textContent = title ?? '';
		}
		else {
			titleEl = document.createElement('title');
			titleEl.textContent = title ?? '';
			document.head.prepend(titleEl);
		}
		return titleEl;
    }

    private resolveMetaAndContent(metaSelector: string, content: string, afterElement?: HTMLElement): HTMLElement {
        if (metaSelector && content) {
			let metaEl = document.head.querySelector(`[${metaSelector}]`);
			
            if (!metaEl) {
                metaEl = document.createElement('meta');

                let property = metaSelector.split('=')[0];
                let value = metaSelector.split('=')[1].replace(/"/g, '');

				if (afterElement) {
					afterElement.after(metaEl)
				}
				else {
					document.head.prepend(metaEl);
				}
				
                metaEl.setAttribute(property, value);
			}
			
			metaEl.setAttribute('content', content);

			return metaEl as HTMLElement;
		}
		return afterElement;
    }
}

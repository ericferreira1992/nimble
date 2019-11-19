import { NimbleApp } from "./../app";
import { Route } from "./../route/route";
import { isNullOrUndefined } from "util";

export class HeaderRender {

    constructor(private app: NimbleApp) {
    }

    public resolveTitleAndMetaTags(route: Route) {
        let page = route.pageInstance;
        
        this.resolveTitle(page.title);

        if (page.meta) {
            this.resolveMetaAndContent('name="description"', page.meta.description);
            this.resolveMetaAndContent('name="keywords"', page.meta.keywords);

            if (page.meta.og) {
                let og = page.meta.og;
                let properties = Object.keys(page.meta.og).filter(x => !isNullOrUndefined(og[x]) && og[x] !== '');
                for (let property of properties) {
                    this.resolveMetaAndContent(`property="og:${property}"`, og[property]);
                }
            }
        }
    }

    private resolveTitle(title: string) {
        if (title) {
            let titleEl = document.head.querySelector('title');
            if (titleEl) {
                titleEl.textContent = title;
            }
            else {
                titleEl = document.createElement('title');
                titleEl.textContent = title;
                document.head.prepend(titleEl);
            }
        }
    }

    private resolveMetaAndContent(metaSelector: string, content: String) {
        if (metaSelector) {
            let metaEl = document.head.querySelector(metaSelector);
            if (metaEl) {
                metaEl.attributes['content'] = content;
            }
            else {
                metaEl = document.createElement('meta');

                let property = metaSelector.split('=')[0];
                let value = metaSelector.split('=')[1].replace(/"/g, '');

                metaEl.attributes[property] = value;
                metaEl.attributes['content'] = content;
                document.head.prepend(metaEl);
            }
        }
    }
}

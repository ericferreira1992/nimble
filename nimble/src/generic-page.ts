import { Page } from './page';

export class GenericPage extends Page {
    template: string;

    constructor(...scopeMerges: any[]) {
        super();
        for(let scope of scopeMerges)
            Object.assign(this, scope);
    }
}
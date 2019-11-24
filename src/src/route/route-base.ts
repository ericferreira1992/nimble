import { Page } from '../page/page';
import { Type } from '../inject/type.interface';

export class RouteBase {
    public path: string = '';
    public isPriority?: boolean = false;
    public page: (() => Promise<any>) | Type<Page> | string;
    public children?: RouteBase[];

    constructor(route?: Partial<RouteBase>) {
        if (route) {
            Object.assign(this, route);
        }
    }
}

export class InjectedPage {
    public template: string;

    constructor(options: Partial<InjectedPage>){
        Object.assign(this, options);
    }
}
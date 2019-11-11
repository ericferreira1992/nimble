import { Page } from './../page';

export class RouteBase {
    public path: string = '';
    public isPriority?: boolean = false;
    public page?: () => Promise<any>;
    public children?: RouteBase[];

    public loadPage?: (success, error?, finaly?) => void;

    public pageInstance?: Page;

    constructor(route?: Partial<RouteBase>) {
        if (route) {
            Object.assign(this, route);
            if (this.page) {
                this.loadPage = (success, error, complete) => {
                    if (!this.pageInstance) {
                        this.page()
                            .then((page) => {
                                this.pageInstance = page.default();
                                success(this.pageInstance)
                            }, error)
                            .finally(complete);
                    }
                    else {
                        success(this.pageInstance);
                        complete();
                    }
                }
            }
        }
    }
}
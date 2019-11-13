import { Route } from "./route/route";

export abstract class Page {
    public abstract template: string;

    public route: Route;
    public isInitialized: boolean = false;
    public isDestroyed: boolean = false;

    public onNeedRerender: (page: Page) => void;

    onInit() {
    }

    onDestroy() {
    }

    public render(action: () => void) {
        if (this.onNeedRerender) {
            action();
            this.onNeedRerender(this);
        }
    }

    public eval(expression: string): any {
        try {
            return (new Function(`with(this) { return ${expression} }`)).call(this);
        }
        catch(e) {
            if (e.message.includes('is not defined')) {
                return '';
            }
            throw e;
        }
    }
}

export class TemplatedPage extends Page {
    constructor(public template: string) {
        super();
    }
}
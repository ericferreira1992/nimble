import { Route } from "../route/route";
import { MetaConfig } from "./decorators/classes/meta-config";
import { IScope } from "./interfaces/scope.interface";

export class Page implements IScope {
    public template: string;
    public title?: string;
    public meta?: MetaConfig;

    public pageParent: any;
    public isInitialized: boolean = false;
    public isDestroyed: boolean = false;

    public onNeedRerender: (page: Page) => void;

    /**
     * When element is rendered
     */
    onInit() {
    }

    /**
     * When element is destroyed
     */
    onDestroy() {
    }

    /**
     * When route match with this page and prepares to be rendered
     */
    onEnter() {

    }

    /**
     * When the route changes and the page no longer matches and will be removed
     */
    onExit() {

    }

    /**
     * Method to render and update current template
     */
    public render(action?: () => void) {
        if (action) action();
        if (this.onNeedRerender) {
            this.onNeedRerender(this);
        }
    }

    public eval(expression: string): any {
        try {
            return (new Function(`with(this) { return ${expression} }`)).call(this);
        }
        catch(e) {
            console.error(e.message);
        }
    }
}
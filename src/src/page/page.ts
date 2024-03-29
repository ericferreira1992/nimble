import { MetaConfig } from "./decorators/classes/meta-config";
import { IScope } from "./interfaces/scope.interface";

export class Page implements IScope {
    public template: string;
    public title?: string;
    public meta?: MetaConfig;

    public pageParent: any;
    public isInitialized: boolean = false;
    public isAfterInitialized: boolean = false;
    public isDestroyed: boolean = false;

    public onNeedRerender: (page: Page) => Promise<any>;

    /**
     * Called When page element is rendered
     */
    onInit() {
    }

    /**
     * Called after onInit is terminated and rendered
     */
    onAfterInit() {
    }

    /**
     * When page element is destroyed
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
    public async render(action?: () => void): Promise<any> {
        if (action) action();
        if (this.onNeedRerender) {
            return await this.onNeedRerender(this);
        }
        return new Promise<any>((resolve) => resolve(null));
    }

    public compile(expression: string): any {
        try {
			return (new Function(`with(this) { return ${expression} }`)).call(this);
        }
        catch(e) {
			console.error(e.message);
			return null;
        }
    }
}
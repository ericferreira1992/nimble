import { DialogRef } from "./dialog-ref";
import { IScope } from "../../page/interfaces/scope.interface";

export abstract class Dialog implements IScope {
    public template: string;
    public abstract dialogRef: DialogRef<Dialog>;
    onNeedRerender: (dialog: Dialog) => void;

    /**Method that will be called when the dialog opens. */
    public onOpen() { }

    /**Method that will be called when the dialog is closed. */
    public onClose() { }

    /**
     * Method to render and update current template
     */
    public async render(action?: () => void): Promise<any> {
        if (action) action();
        if (this.onNeedRerender) {
            return await this.onNeedRerender(this);
        }
        return new Promise<any>((resolve: (value?: any) => void) => {
			return resolve();
		});
    }

    public compile(expression: string): any {
        try {
            return (new Function(`with(this) { return ${expression} }`)).call(this);
        }
        catch(e) {
            console.error(e);
			return null;
        }
    }
}
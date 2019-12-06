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
    public render(action?: () => void) {
        if (this.onNeedRerender) {
            if (action) action();
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
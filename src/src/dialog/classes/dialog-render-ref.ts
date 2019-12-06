import { Dialog } from "./dialog";
import { DialogRef } from "./dialog-ref";

export class DialogRenderRef<T extends Dialog> {
    public rootElement: HTMLElement;
    public dialogRef: DialogRef<T>;
    public listenerCancelFunctions: (() => void)[] = [];

    public set containerElement(element: HTMLElement) {
        let dialogContainerElement = this.rootElement.querySelector('.nimble-dialog-container');
        if (dialogContainerElement) {
            dialogContainerElement.append(element);
            this.applyConfigDimesions();
        }
    }

    public get containerElement(): HTMLElement {
        let dialogContainerElement = this.rootElement.querySelector('.nimble-dialog-container');
        if (dialogContainerElement) {
            return dialogContainerElement as HTMLElement;
        }
        return null;
    }

    public get areaElement(): HTMLElement {
        let dialogAreaElement = this.rootElement.querySelector('.nimble-dialog-area');
        return (dialogAreaElement) ? dialogAreaElement as HTMLElement : null;
    }
    
    constructor(init: { dialogRef: DialogRef<T>, rootElement: HTMLElement }) {
        this.dialogRef = init.dialogRef;
        this.rootElement = init.rootElement;
    }

    public closeElements(onEnd: () => void) {
        if (this.rootElement)
            this.rootElement.classList.add('out');
        if (this.containerElement)
            this.containerElement.classList.add('out');

        this.listenerCancelFunctions.forEach(x => x());

        setTimeout(() => {
            onEnd();
        }, 300);
    }

    public removeFromDOM() {
        if (this.rootElement && this.rootElement.parentElement)
            this.rootElement.parentElement.removeChild(this.rootElement);
        delete this.rootElement;
    }

    private applyConfigDimesions() {
        let areaElement = this.rootElement.querySelector('.nimble-dialog-area') as HTMLElement;
        if (areaElement) {
            if (this.dialogRef.config.width)
                areaElement.style.width = this.dialogRef.config.width;
            if (this.dialogRef.config.maxWidth)
                areaElement.style.maxWidth = this.dialogRef.config.maxWidth;
            if (this.dialogRef.config.minWidth)
                areaElement.style.minWidth = this.dialogRef.config.minWidth;
        }
    }
}
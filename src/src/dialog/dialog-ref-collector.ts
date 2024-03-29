import { Dialog } from "./classes/dialog";
import { DialogRenderRef } from "./classes/dialog-render-ref";
import { Injectable } from "../inject/injectable";
import { ElementListenersCollector } from "../providers/listeners-collector";
import { ElementStructureAbstract } from "../render/element-structure-abstract";

@Injectable({ single: true })
export class DialogRefCollector {

    constructor(
        private listenerCollector: ElementListenersCollector
    ) {
    }

    private dialogInstances: DialogRenderRef<Dialog>[] = [];

    public addOpenedDialog(dialog: DialogRenderRef<Dialog>){
        this.dialogInstances.push(dialog);
		document.body.style.overflow = 'hidden';
    }

    public remove(renderRef: DialogRenderRef<Dialog>){
        this.removeListenersDialog(renderRef);
        let index = this.dialogInstances.indexOf(renderRef);
        delete this.dialogInstances[index];
        this.dialogInstances = this.dialogInstances.filter((x, i) => i !== index);
		if (this.dialogInstances.length === 0) {
			document.body.style.overflow = '';
		}
    }

    public getDialogRefByDialogInstance(dialog: Dialog) {
        let ref = this.dialogInstances.find(x => x.dialogRef.instance === dialog);
        return ref;
    }

    public getLast() {
        let length = this.dialogInstances.length;
        return length > 0 ? this.dialogInstances[length - 1] : null;
    }

    private removeListenersDialog(renderRef: DialogRenderRef<Dialog>) {
        this.removeStructuredListeners(renderRef.structuredTemplate);
    }

    private removeStructuredListeners(structured: ElementStructureAbstract) {
        if (structured.compiledNode) {
            this.listenerCollector.unsubscribeAllFromElement(structured.compiledNode as HTMLElement);
        }
        if (structured.children && structured.children.length > 0) {
            for (let child of structured.children) {
                this.removeStructuredListeners(child);
            }
        }
    }
}
import { Dialog } from "./classes/dialog";
import { DialogRenderRef } from "./classes/dialog-render-ref";
import { Injectable } from "../inject/injectable";

@Injectable({ single: true })
export class DialogRefCollector {
    private dialogInstances: DialogRenderRef<Dialog>[] = [];

    public add(dialog: DialogRenderRef<Dialog>){
        this.dialogInstances.push(dialog);
    }

    public remove(dialog: DialogRenderRef<Dialog>){
        let index = this.dialogInstances.indexOf(dialog);
        delete this.dialogInstances[index];
        this.dialogInstances = this.dialogInstances.filter((x, i) => i !== index);
    }

    public getDialogRefByDialogInstance(dialog: Dialog) {
        let ref = this.dialogInstances.find(x => x.dialogRef.instance === dialog);
        return ref;
    }

    public getLast() {
        let length = this.dialogInstances.length;
        return length > 0 ? this.dialogInstances[length - 1] : null;
    }
}
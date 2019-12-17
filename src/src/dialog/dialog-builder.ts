import { Injectable } from '../inject/injectable';
import { InjectionToken } from '../inject/provider';
import { Type } from '../inject/type.interface';
import { DialogRef } from './classes/dialog-ref';
import { NimbleApp, NimbleAppState } from '../app';
import { Dialog } from './classes/dialog';
import { DialogOpenConfig } from './classes/dialog-open-config';
import { DialogRender } from './dialog-render';
import { DialogRefCollector } from './dialog-ref-collector';
import { DialogRenderRef } from './classes/dialog-render-ref';

export const DIALOG_REF = new InjectionToken('DIALOG_REF');

@Injectable()
export class DialogBuilder {

    private get app() { return NimbleApp.instance; }

    constructor(
        private dialogRender: DialogRender,
        private dialogCollector: DialogRefCollector,
    ) {

    }

    public open<T extends Dialog>(dialog: Type<T>, config?: DialogOpenConfig): DialogRef<T> {

        let openResolve: () => void;
        let dialogRef = new DialogRef<T>(
            {
                config: config,
                type: dialog,
                onOpen: new Promise<any>((resolve) => {
                    openResolve = resolve;
                })
            },
            this.close.bind(this)
        );

        NimbleApp.registerProvider({ provide: DIALOG_REF, useValue: dialogRef });

        dialogRef.instance = NimbleApp.inject(dialog);
        dialogRef.instance.onNeedRerender = this.rerender.bind(this);

        let dialogRenderRef = this.dialogRender.renderDialog(dialogRef);
        this.dialogCollector.add(dialogRenderRef);
        
        openResolve();
        dialogRef.instance.onOpen();

        NimbleApp.unregisterProvider(DIALOG_REF);

        return dialogRef;
    }

    public closeAll() {
        let dialogRenderRef = this.dialogCollector.getLast();
        while(dialogRenderRef) {
            dialogRenderRef.dialogRef.close();
            dialogRenderRef = this.dialogCollector.getLast();
        }
    }

    private close<T extends Dialog>(ref: DialogRef<T> | DialogRenderRef<T>, resolver: (a: any) => void, data?: any) {
        let dialogRenderRef = (ref instanceof DialogRef) ? this.dialogCollector.getDialogRefByDialogInstance(ref.instance) : ref;
        if (dialogRenderRef) {
            dialogRenderRef.closeElements(() => {
                dialogRenderRef.removeFromDOM();
                dialogRenderRef.dialogRef.instance.onClose();
                resolver(data);
            });
            this.dialogCollector.remove(dialogRenderRef);
        }
    }

    private rerender<T extends Dialog>(dilaog: T) {
        this.app.state = NimbleAppState.RERENDERING;

        let dialogRenderRef = this.dialogCollector.getDialogRefByDialogInstance(dilaog);
        this.dialogRender.rerenderDialog(dialogRenderRef);
        
        this.app.state = NimbleAppState.INITIALIZED;
    }
} 
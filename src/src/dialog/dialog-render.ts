import { Injectable } from "../inject/injectable";
import { Dialog } from "./classes/dialog";
import { DialogRenderRef } from "./classes/dialog-render-ref";
import { DialogRef } from "./classes/dialog-ref";
import { RenderAbstract } from "../render/render-abstract";
import { ElementListener } from "../render/listener";
import { ElementListenersCollector } from "../providers/listeners-collector";
import { RenderHelper } from "../render/render-helper";
import { ElementStructure } from "../render/element-structure";

@Injectable({ single: true })
export class DialogRender extends RenderAbstract {

    constructor(
        protected listenersCollector: ElementListenersCollector,
        private listener: ElementListener
    ) {
        super(listenersCollector);
    }

    public renderDialog<T extends Dialog>(dialogRef: DialogRef<T>): DialogRenderRef<T> {

        let renderRef = new DialogRenderRef<T>({
            dialogRef: dialogRef,
            structuredTemplate: this.createStructure(dialogRef)
        });

        this.createElementFromStructure(renderRef.structuredTemplate);
		let templateCompiled = this.compileElementFromStructure(renderRef.structuredTemplate);
		this.rerenderDialog(renderRef);
        renderRef.insertDialogArea(templateCompiled);

        this.applyCloseEvents(renderRef);

        return renderRef;
    }

    public rerenderDialog<T extends Dialog>(renderRef: DialogRenderRef<T>) {
        if (renderRef) {
            this.recompileElementFromStructure(renderRef.structuredTemplate);
        }
    }

    private createStructure(dialog: DialogRef<Dialog>): ElementStructure {
        let htmlTemplate = dialog.instance.template;
        let scope = dialog.instance;
        return RenderHelper.buildStructureFromTemplate(htmlTemplate, scope, 'nimble-dialog-area');
    }

    private applyCloseEvents<T extends Dialog>(renderRef: DialogRenderRef<T>) {
        this.applyClickOutEvent(renderRef);
        this.applyEscapeEvent(renderRef);
    }

    private applyClickOutEvent<T extends Dialog>(renderRef: DialogRenderRef<T>) {
        let areaElement = renderRef.areaElement;
        let backdropElement = renderRef.rootElement.querySelector('.nimble-dialog-backdrop');
        let containerElement = renderRef.containerElement;

        let canClose = false;
        renderRef.listenerCancelFunctions.push(this.listener.listen(renderRef.rootElement, 'mousedown', (e: MouseEvent) => {
            if (!canClose && renderRef && renderRef.areaElement && (backdropElement === e.target || containerElement === e.target)) {
                let bounds = areaElement.getBoundingClientRect();
                if (e.pageX < bounds.left || e.pageX > bounds.right || e.pageY < bounds.top || e.pageY > bounds.bottom){
                    if (renderRef.dialogRef.clickoutClose) {
                        canClose = true;
                    }
                }
            }
        }));

        renderRef.listenerCancelFunctions.push(this.listener.listen(renderRef.rootElement, 'mouseup', (e: MouseEvent) => {
            if (canClose)
                renderRef.dialogRef.close();
        }));
    }

    private applyEscapeEvent<T extends Dialog>(renderRef: DialogRenderRef<T>) {
        renderRef.listenerCancelFunctions.push(this.listener.listen(window, 'keydown', (e: KeyboardEvent) => {
            if (renderRef && renderRef.dialogRef) {
                if (e.keyCode === 27 && renderRef.dialogRef.escClose)
                    renderRef.dialogRef.close();
            }
        }));
    }
}
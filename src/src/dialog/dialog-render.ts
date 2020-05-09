import { HeaderRender } from "../render/header-render";
import { AttributesRender } from "../render/attributes-render";
import { Injectable } from "../inject/injectable";
import { Dialog } from "./classes/dialog";
import { DialogRenderRef } from "./classes/dialog-render-ref";
import { DialogRef } from "./classes/dialog-ref";
import { Render } from "../render/render.abstract";
import { Listener } from "../render/listener";

@Injectable({ single: true })
export class DialogRender extends Render {

    constructor(
        headerRender: HeaderRender,
        attributesRender: AttributesRender,
        private listener: Listener
    ) {
        super(headerRender, attributesRender);
    }

    public renderDialog<T extends Dialog>(dialogRef: DialogRef<T>) {

        let renderRef = new DialogRenderRef<T>({
            dialogRef: dialogRef,
            rootElement: this.createRootDialogElement()
        });
        renderRef.containerElement = this.createDialogTemplateAndResolve(dialogRef.instance);

        this.applyCloseEvents(renderRef);
        
        renderRef.executedDirectives = this.attributesRender.processesPendingAttributes();

        return renderRef;
    }

    public rerenderDialog<T extends Dialog>(renderRef: DialogRenderRef<T>) {
        if (renderRef && renderRef.areaElement) {
            renderRef.notifyDestructionExecutedsDirectives();
            
            let realAreaElement = renderRef.areaElement;
            let virtualAreaElement = this.createDialogTemplateAndResolve(renderRef.dialogRef.instance);
            virtualAreaElement.className = realAreaElement.className;
            if (realAreaElement.hasAttribute('style'))
                virtualAreaElement.setAttribute('style', realAreaElement.attributes['style'].value);
    
            let { executedsDirectives } = this.diffTreeElementsAndUpdateOld(
                realAreaElement,
                virtualAreaElement,
                [],
                []
            );
            
            renderRef.executedDirectives = executedsDirectives;
        }
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

    private createDialogTemplateAndResolve(dialog: Dialog): HTMLElement {
        let virtualElement = this.createVirtualElement(dialog.template);
        this.attributesRender.resolveChildren(virtualElement.children, dialog);
        return virtualElement;
    }

    private createVirtualElement(templateHtml: string) {
        let element = document.createElement('nimble-dialog-area');
        element.innerHTML = templateHtml;
        return element;
    }

    private createRootDialogElement() {
        let dialogElement = document.createElement('nimble-dialog');
        document.body.append(dialogElement);

        return dialogElement;
    }
}
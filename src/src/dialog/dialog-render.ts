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
        
        this.attributesRender.processesPendingAttributes();

        this.applyCloseEvents(renderRef);

        return renderRef;
    }

    public rerenderDialog<T extends Dialog>(dialogRenderRef: DialogRenderRef<T>) {
        let realAreaElement = dialogRenderRef.areaElement;
        let virtualAreaElement = this.createDialogTemplateAndResolve(dialogRenderRef.dialogRef.instance);
        virtualAreaElement.className = realAreaElement.className;
        if (realAreaElement.hasAttribute('style'))
            virtualAreaElement.setAttribute('style', realAreaElement.attributes['style'].value);

        this.diffTreeElementsAndUpdateOld(realAreaElement, virtualAreaElement);
        
        this.attributesRender.processesPendingAttributes();
    }

    private applyCloseEvents<T extends Dialog>(renderRef: DialogRenderRef<T>) {
        let backdropElement = renderRef.rootElement.querySelector('.nimble-dialog-backdrop');
        let containerElement = renderRef.containerElement;

        renderRef.listenerCancelFunctions.push(this.listener.listen(renderRef.rootElement, 'click', (e: MouseEvent) => {
            if (backdropElement === e.target || containerElement === e.target) {
                if (renderRef.dialogRef.clickoutClose)
                    renderRef.dialogRef.close();
            }
        }));
        
        renderRef.listenerCancelFunctions.push(this.listener.listen(window, 'keydown', (e: KeyboardEvent) => {
            if (e.keyCode === 27 && renderRef.dialogRef.escClose) {
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
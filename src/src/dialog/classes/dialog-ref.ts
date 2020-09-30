import { DialogOpenConfig } from "./dialog-open-config";
import { Dialog } from "./dialog";
import { Type } from "../../inject/type.interface";

export class DialogRef<T extends Dialog> {
    public data: any;
    public config: DialogOpenConfig;
    public escClose: boolean = true;
    public clickoutClose: boolean = true;
    public onOpen: Promise<any>;
    public onClose: Promise<any>;
    public instance: T;
	public type: Type<T>;

	public get element(): HTMLElement {
		return this.getElement();
	}

    private promiseCloseResolve: (a: any) => void;
    
    constructor(
		obj: Partial<DialogRef<T>>,
		private getElement: () => HTMLElement,
        private builderClose: (ref: DialogRef<T>, resolver: (a: any) => void, data?: any) => void
    ) {
        Object.assign(this, obj);
        if (this.config) this.data = this.config.data;

        this.onClose = new Promise<any>((resolve) => {
            this.promiseCloseResolve = resolve;
        });
    }

    public close(data?: any) {
        setTimeout(() => this.builderClose(this, this.promiseCloseResolve, data));
    }
}
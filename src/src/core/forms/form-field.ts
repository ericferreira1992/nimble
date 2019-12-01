import { Observer } from "../observer";

export class FormField {
    public element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    private _value: any;
    public get value() { return this._value; }


    private _valueChanges: Observer<any> = new Observer<any>();
    public get valueChanges() { return this._valueChanges; }

    constructor(obj?: Partial<FormField>){
        Object.assign(this, obj);
    }

    public setValue(value: any, options: { noNotify: boolean } = {} as any) {
        this._value = value;
        if (this.element)
            this.element.value = this.value;
        
        if (!options || !options.noNotify)
            this.valueChanges.notify(value);
    }
}
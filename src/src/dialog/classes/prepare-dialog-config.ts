export class PrepareDialogConfig {
    public template: string = '';
    public style?: string = '';

    constructor(obj: Partial<PrepareDialogConfig>) {
        Object.assign(this, obj);
    }
}
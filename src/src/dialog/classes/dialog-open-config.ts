export class DialogOpenConfig {
    data?: any;
    width?: string;
    maxWidth?: string;
    minWidth?: string;
    
    constructor(obj: Partial<DialogOpenConfig>) {
        Object.assign(this, obj);
    }
}
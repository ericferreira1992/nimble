export class Task {
    public id: number;
    public name: string = '';
    public type: string = '';
    public done: boolean = false;
    public checklist: string[] = [];
    public date: string = '';
    public order: number;
    public teste: string = '';

    constructor(obj?: Partial<Task>) {
        Object.assign(this, obj);
    }
}
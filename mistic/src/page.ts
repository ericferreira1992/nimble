export abstract class Page {
    public abstract template: string;

    public render(): string {
        return this.template;
    }
}
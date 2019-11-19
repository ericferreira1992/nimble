import { Page } from "./page";

export class TemplatedPage extends Page {
    constructor(public template: string) {
        super();
    }
}
import { Page } from "./page";
import { Injectable } from "../inject/injectable";

@Injectable()
export class TemplatedPage extends Page {
    constructor(public template: string) {
        super();
    }
}
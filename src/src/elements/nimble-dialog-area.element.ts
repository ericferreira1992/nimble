export class NimbleDialogArea extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.classList.add('nimble-dialog-area');
    }
}
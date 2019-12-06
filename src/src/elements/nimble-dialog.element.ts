export class NimbleDialog extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.classList.add('nimble-dialog');
        this.innerHTML = `
        <div class="nimble-dialog-backdrop"></div>
        <div class="nimble-dialog-panel">
            <div class="nimble-dialog-container">
            </div>
        </div>`;
    }
}
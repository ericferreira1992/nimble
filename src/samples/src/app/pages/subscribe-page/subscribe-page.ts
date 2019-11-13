import { Page } from "../../../../../src/nimble";
import './subscribe-page.html';
import './subscribe-page.scss';

class SubscribePage extends Page {
    public template: string = require(`./subscribe-page.html`);

    public showAlert() {
        alert('TESTE');
    }

}
export default () => new SubscribePage();
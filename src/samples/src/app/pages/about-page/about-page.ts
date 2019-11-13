import { Page } from "../../../../../src/nimble";
import './about-page.html';
import './about-page.scss';

class AboutPage extends Page {
    public template: string = require('./about-page.html');

    onInit() {
        console.log('About -> INITIALIZED');
    }

    onDestroy() {
        console.log('About -> DESTROYED');
    }

}
export default () => new AboutPage();
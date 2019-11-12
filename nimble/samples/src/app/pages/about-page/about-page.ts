import { Page } from "../../../../../src/nimble";
import './about-page.html';
import './about-page.scss';

class AboutPage extends Page {
    public template: string = require('./about-page.html');
    
}
export default new AboutPage();
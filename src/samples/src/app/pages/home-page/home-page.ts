import { Page } from "../../../../../src/nimble";
import './home-page.html';
import './home-page.scss';

class HomePage extends Page {
    public template: string = require('./home-page.html');
    
}

export default () => new HomePage();
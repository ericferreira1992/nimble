import { Page } from "../../../../../src/nimble";
import './main-page.html';
import './main-page.scss';

class MainPage extends Page {
    public template: string = require('./main-page.html');
    
    public menuItems: any[] = [
        { name: 'Home', href: '/home' },
        { name: 'About', href: '/about' },
    ];
}

export default new MainPage();
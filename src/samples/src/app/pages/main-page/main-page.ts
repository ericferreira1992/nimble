import { Page } from "../../../../../src/nimble";
import './main-page.html';
import './main-page.scss';

class MainPage extends Page {
    public template: string = require('./main-page.html');
    
    public menuItems: any[] = [
        { name: 'Home', href: '/home' },
        { name: 'About', href: '/about' },
    ];

    public changeMenuItens() {
        this.render(() => {
            if (this.menuItems.length >= 2)
                this.menuItems.pop();
            else
                this.menuItems.push({ name: 'About', href: '/about' });
        });
    }
}

export default () => new MainPage();
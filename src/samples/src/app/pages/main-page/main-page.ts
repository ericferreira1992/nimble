import { Page, PreparePage } from "nimble";

@PreparePage({
    template: require('./main-page.html'),
    style: require('./main-page.scss'),
})
export class MainPage extends Page {
    
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
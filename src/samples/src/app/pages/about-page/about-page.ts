import { Page, PreparePage } from "nimble";
import AuthService from "../../services/auth.service";

@PreparePage({
    template: require('./about-page.html'),
    style: require('./about-page.scss'),
    title: 'About'
})
export default class AboutPage extends Page {

    constructor(public authService: AuthService) {
        super();
    }

    onEnter() {
        this.authService.teste = 'ENTER ABOUT';
    }

    onExit() {
    }

}
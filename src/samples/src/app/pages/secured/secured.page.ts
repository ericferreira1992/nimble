import { Page, PreparePage, Router } from '@nimble';
import { AuthService } from '../../services/auth/auth.service';

@PreparePage({
    template: require('./secured.page.html'),
    style: require('./secured.page.scss'),
})
export default class SecuredPage extends Page {

    constructor(private authService: AuthService) {
        super();
    }

    onInit() {
    }

    public logout() {
        this.authService.logout();
    }

}
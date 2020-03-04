import { Page, PreparePage, Router } from '@nimble-ts/core';
import { AuthService } from '../../services/auth/auth.service';

@PreparePage({
    template: require('./secured.page.html'),
    style: require('./secured.page.scss'),
})
export class SecuredPage extends Page {

    constructor(private authService: AuthService) {
        super();
    }

    onInit() {
    }

    public update(){
        this.render();
    }

    public logout() {
        this.authService.logout();
    }

}
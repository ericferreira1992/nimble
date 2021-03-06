import { Page, PreparePage } from '@nimble-ts/core/page';
import { RouteParams } from '@nimble-ts/core/providers/route-params';
import { AuthService } from 'src/app/services/auth/auth.service';

@PreparePage({
    template: require('./public.page.html'),
    style: require('./public.page.scss')
})
export class PublicPage extends Page {

    constructor(
        private authService: AuthService,
        private routeParams: RouteParams
    ) {
        super();
        console.log(this.routeParams);
    }

    onInit() {
    }

}
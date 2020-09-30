import { Page, PreparePage } from '@nimble-ts/core/page';
import { AuthService } from 'src/app/services/auth/auth.service';

@PreparePage({
    template: require('./public.page.html'),
    style: require('./public.page.scss')
})
export class PublicPage extends Page {

    constructor(
		private authService: AuthService
	) {
        super();
    }

    onInit() {
    }

}
import { Page, PreparePage, HttpClient } from 'nimble';
import AuthService from '../../services/auth.service';

@PreparePage({
    template: require('./home-page.html'),
    style: require('./home-page.scss'),
    title: 'Home'
})
export default class HomePage extends Page {

    public loadingRequest: boolean = false;

    constructor(
        public authService: AuthService,
        private httpClient: HttpClient
    ) {
        super();
    }

    onEnter() {
        /* this.loadingRequest = true;
        this.httpClient.get('https://sbbackoffice.getsandbox.com/users').then(
            (response) => {
                this.render(() => {
                    console.log(response.data);
                    this.loadingRequest = false;
                });
            },
            (error) => {
                this.render(() => {
                    console.log(error.error);
                    this.loadingRequest = false;
                });
            }
        ) */
    }

    onExit() {
    }
}
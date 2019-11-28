import { Page, PreparePage, HttpClient } from '@nimble';

@PreparePage({
    template: require('./tasks.page.html'),
    style: require('./tasks.page.scss'),
    title: 'Tasks'
})
export default class TasksPage extends Page {

    public loadingRequest: boolean = false;

    constructor(
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
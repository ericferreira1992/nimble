import { Page, Router, RouterEvent } from "../../../../../src/nimble";
import './root-page.html';
import './root-page.scss';

class RootPage extends Page {
    public template: string = require('./root-page.html');

    public loading: boolean = false;

    private listeners: any[] = [];

    onInit() {
        this.listeners = [
            Router.addListener(RouterEvent.START_CHANGE, () => {
                this.render(() => {
                    this.loading = true;
                });
            }),
            Router.addListener(RouterEvent.FINISHED_CHANGE, () => {
                this.render(() => {
                    this.loading = false;
                });
            })
        ]
    }

    onDestroy() {
        console.log('DESTROYED');
        this.listeners.forEach((cancelFunc) => cancelFunc());
    }
}

export default () => new RootPage();
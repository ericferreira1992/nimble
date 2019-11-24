import { Page, Router, RouterEvent, PreparePage } from "nimble";

@PreparePage({
    template: require('./root-page.html'),
    style: require('./root-page.scss'),
})
export default class RootPage extends Page {
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
import { Page, Router, RouterEvent, PreparePage } from '@nimble';

@PreparePage({
    template: require('./root-page.html'),
    style: require('./root-page.scss'),
})
export default class RootPage extends Page {
    public loading: boolean = true;

    private listensCancel: (() => void)[] = [];

    onEnter() {
        this.listensCancel.push(Router.addListener(RouterEvent.START_CHANGE, () => {
            this.render(() => {
                this.loading = true;
            });
        }));
        this.listensCancel.push(Router.addListener(RouterEvent.FINISHED_CHANGE, () => {
            this.render(() => {
                this.loading = false;
            });
        }));
    }

    onDestroy() {
        if (this.listensCancel)
            this.listensCancel.forEach(x => x());
    }
}
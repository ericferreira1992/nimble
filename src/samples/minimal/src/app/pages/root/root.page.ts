import { Page, PreparePage, Router, RouterEvent } from '@nimble-ts/core';

@PreparePage({
    template: require('./root.page.html'),
    style: require('./root.page.scss')
})
export class RootPage extends Page {
    public get routePath() { return Router.currentPath; }

    public loading = false;
    public menuItems = [
        { text: 'First Page', path: 'first' },
        { text: 'Second Page', path: 'second' },
        { text: 'Third Page', path: 'third' },
    ];

    private cancelListeners: any[] = [];

    onInit() {
        this.cancelListeners = [
            Router.addListener(RouterEvent.STARTED_CHANGE, () => {
                this.render(() => this.loading = true);
            }),
            Router.addListener([RouterEvent.FINISHED_CHANGE, RouterEvent.CHANGE_REJECTED, RouterEvent.CHANGE_ERROR], () => {
                this.render(() => this.loading = false);
            })
        ]
    }

    onDestroy() {
        this.cancelListeners.forEach(x => x());
    }
}
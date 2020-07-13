import { Page, PreparePage, Router } from '@nimble-ts/core';

@PreparePage({
    template: require('./root.page.html'),
    style: require('./root.page.scss')
})
export class RootPage extends Page {
    public get routePath() { return Router.currentPath; }

    public loading = false;
    public menuItems = [
        { text: 'First page', path: '' },
        { text: 'Second page', path: 'second' },
        { text: 'Third page', path: 'third' },
    ];

    private cancelListeners: (() => void)[] = [];

    onInit() {
        this.cancelListeners = [
            Router.addListener('STARTED_CHANGE', () => {
                this.render(() => this.loading = true);
            }),
            Router.addListener(['FINISHED_CHANGE', 'CHANGE_REJECTED', 'CHANGE_ERROR'], () => {
				this.render(() => this.loading = false);
            })
        ]
	}

    onDestroy() {
        this.cancelListeners.forEach(unlistener => {
			unlistener();
		});
    }
}
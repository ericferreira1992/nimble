import { Page, PreparePage } from '@nimble-ts/core';

@PreparePage({
    template: require('./first.page.html'),
    style: require('./first.page.scss'),
    title: 'Nimble - First Page'
})
export class FirstPage extends Page {

	public width: number = 10;

    constructor() {
        super();
	}
	
	public increase() {
		this.render(() => {
			this.width  = Math.min((this.width + 10), 100);
		});
	}
	public decrease() {
		this.render(() => {
			this.width = Math.max((this.width - 15), 0);
		});
	}
}
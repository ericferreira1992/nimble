import { Page, PreparePage } from '@nimble-ts/core';

@PreparePage({
    template: require('./third.page.html'),
    style: require('./third.page.scss'),
    title: 'Nimble - Third Page'
})
export class ThirdPage extends Page {

	public dropDown = {
		selected: '',
		show: false,
		items: [
			{ id: 1, text: '🍏 Apple' },
			{ id: 2, text: '🍓 Strawberry' },
			{ id: 3, text: '🍉 Watermelon' },
		]
	}

	constructor() {
		super()
	}

	onInit() {
	}

	public toggleShow() {
		this.render(() => {
			this.dropDown.show = !this.dropDown.show;
		});
	}

	public selectItem(item) {
		this.render(() => {
			this.dropDown.selected = item;
			this.dropDown.show = false;
		});
	}

	onDestroy() {
	}
}
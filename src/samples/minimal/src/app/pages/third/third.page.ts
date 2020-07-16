import { Page, PreparePage, Form } from '@nimble-ts/core';

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

	public myForm: Form;
	public needShowFormData: boolean = false;

	constructor() {
		super();

		this.myForm = new Form({
			anyText: { value: '' }
		});
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

	public showFormData() {
		this.render(() => {
			this.needShowFormData = true;
		});
	}

	onDestroy() {
	}
}
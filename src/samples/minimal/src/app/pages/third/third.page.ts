import { Page, PreparePage } from '@nimble-ts/core';

@PreparePage({
    template: require('./third.page.html'),
    style: require('./third.page.scss'),
    title: 'Nimble - Third Page'
})
export class ThirdPage extends Page {

}
import { Page, PreparePage } from '@nimble-ts/core';

@PreparePage({
    template: require('./second.page.html'),
    style: require('./second.page.scss'),
    title: 'Nimble - First Page'
})
export class SecondPage extends Page {

}
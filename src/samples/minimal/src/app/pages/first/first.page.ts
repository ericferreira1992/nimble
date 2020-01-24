import { Page, PreparePage } from '@nimble-ts/core';

@PreparePage({
    template: require('./first.page.html'),
    style: require('./first.page.scss'),
    title: 'Nimble - First Page'
})
export default class FirstPage extends Page {
    
}
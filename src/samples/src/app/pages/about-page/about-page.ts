import { Page, PreparePage } from "nimble";

@PreparePage({
    template: require('./about-page.html'),
    style: require('./about-page.scss'),
    title: 'About'
})
export default class AboutPage extends Page {

    onInit() {
        console.log('About -> INITIALIZED');
    }

    onDestroy() {
        console.log('About -> DESTROYED');
    }

}
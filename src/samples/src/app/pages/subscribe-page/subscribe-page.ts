import { Page, PreparePage, enviroment } from "nimble";

@PreparePage({
    template: require('./subscribe-page.html'),
    style: require('./subscribe-page.scss'),
    title: 'Subscribe',
})
export default class SubscribePage extends Page {

    public showAlert() {
        console.log(enviroment);
    }

}
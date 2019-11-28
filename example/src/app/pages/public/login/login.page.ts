import { Page, PreparePage } from '@nimble';

@PreparePage({
    template: require('./login.page.html'),
    style: require('./login.page.scss')
})
export default class LoginPage extends Page {

    onEnter() {
    }

    onExit() {
    }
}
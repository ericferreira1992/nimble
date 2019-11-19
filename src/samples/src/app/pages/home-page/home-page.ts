import { Page, PreparePage } from "nimble";;

@PreparePage({
    template: require('./home-page.html'),
    style: require('./home-page.scss'),
})
export class HomePage extends Page {
}

export default () => new HomePage();
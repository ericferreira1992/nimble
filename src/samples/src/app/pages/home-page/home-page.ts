import { Page, PreparePage } from "nimble";;

@PreparePage({
    template: require('./home-page.html'),
    style: require('./home-page.scss'),
    title: 'Home'
})
export default class HomePage extends Page {
    
    constructor(){
        super();
    }

}
import { Provider, Router } from '@nimble';

@Provider({
    single: true
})
export default class AuthService {
    public user: any = null;

    public get isLogged() { return this.user !== null; }

    constructor() {

    }

    public validAuthCurrentRoute() {
        let route = Router.currentPath;
        
        if (!this.isLogged && route !== '/login')
            Router.redirect('/login');
        else if (this.isLogged && route === '/login')
            Router.redirect('/tasks');
    }
}
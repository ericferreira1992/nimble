import { Provider } from 'nimble';

@Provider({
    single: true
})
export default class AuthService {
    public user: any = null;
    public teste: string = 'INITIAL';

    public get isLogged() { return this.user !== null; }

    constructor() {

    }
}
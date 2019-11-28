import { Provider, Router, HttpClient } from '@nimble';

@Provider({
    single: true
})
export class AuthService {
    public user: any = null;

    public get isLogged() { return this.user !== null; }

    constructor(
        private httpClient: HttpClient
    ) {
    }

    public login(form: { user: string, password: string }) {
        return new Promise<any>((resolve) => {
            setTimeout(() => {
                this.user = {
                    name: 'Eric Ferreira',
                    id: 123
                };
                resolve(true);
            }, 2000);
        });
    }
}
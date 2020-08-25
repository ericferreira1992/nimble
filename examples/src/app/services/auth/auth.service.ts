import { Injectable, Router, HttpClient } from '@nimble-ts/core';

@Injectable({
    single: true
})
export class AuthService {
    public get user() {
        const user = JSON.parse(localStorage.getItem('AuthUser'));
        if (user) return user;
        return null;
    }

    public get isLogged() { return this.user !== null; }

    constructor(
        private httpClient: HttpClient
    ) {
    }

    private setUser(user: any) {
        localStorage.setItem('AuthUser', JSON.stringify(user));
    }

    public login(form: { user: string, password: string }) {
        return new Promise<any>((resolve) => {
            setTimeout(() => {
                this.setUser({
                    name: 'Eric Ferreira',
                    id: 123
                });
                resolve(true);
            }, 2000);
        });
    }

    logout() {
        localStorage.removeItem('AuthUser');
        Router.redirect('/login');
    }
}
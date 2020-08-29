import { RouteGuard, Route, Router } from '@nimble-ts/core/route';
import { Injectable } from '@nimble-ts/core/inject';
import { AuthService } from "./auth.service";

@Injectable()
export class AuthRouteActivate extends RouteGuard {

    constructor(
        private authService: AuthService
    ){
        super();
    }

    public doActivate(currentPath: string, nextPath: string, route: Route): boolean {
    
        if (!this.authService.isLogged && nextPath !== '/login') {
            console.log('UNLOGGED');
            Router.redirect('/login');
            return false;
        }
        else if (this.authService.isLogged && nextPath === '/login'){
            console.log('LOGGED');
            Router.redirect('/tasks');
            return false;
        }

        return true;
    }
}
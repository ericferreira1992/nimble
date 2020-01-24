import { ActivateRoute, Route, Router, Injectable } from "@nimble-ts/core";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthRouteActivate extends ActivateRoute {

    constructor(
        private authService: AuthService
    ){
        super();
    }

    public doActivate(currentPath: string, route: Route): boolean {
    
        if (!this.authService.isLogged && currentPath !== '/login') {
            console.log('UNLOGGED');
            Router.redirect('/login');
            return false;
        }
        else if (this.authService.isLogged && currentPath === '/login'){
            console.log('LOGGED');
            Router.redirect('/tasks');
            return false;
        }

        return true;
    }
}
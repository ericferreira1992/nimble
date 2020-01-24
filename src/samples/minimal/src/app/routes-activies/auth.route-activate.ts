import { ActivateRoute, Route, Router, Injectable } from "@nimble-ts/core";

@Injectable()
export class AuthRouteActivate extends ActivateRoute {

    constructor(
    ){
        super();
    }

    public doActivate(currentPath: string, route: Route): boolean {
        let isLooged = true;
        if (isLooged && currentPath === '/third'){
            console.log('LOGGED');
            Router.redirect('/first');
            return false;
        }

        return true;
    }
}
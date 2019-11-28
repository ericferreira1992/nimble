import { Route } from './route';

export abstract class ActivateRoute {
    public abstract doActivate(doActivate: string, route: Route): boolean;
}
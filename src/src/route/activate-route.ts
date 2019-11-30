import { Route } from './route';

export abstract class ActivateRoute {
    public abstract doActivate(currentPath: string, route: Route): boolean;
}
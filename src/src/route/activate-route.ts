import { RouteBase } from './route-base';

export abstract class ActivateRoute {
    public abstract doActivate(currentPath: string, nextPath: string, route: RouteBase): boolean;
}
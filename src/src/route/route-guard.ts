import { RouteBase } from './route-base';

export abstract class RouteGuard {
    public abstract doActivate(currentPath: string, nextPath: string, route: RouteBase): boolean;
}
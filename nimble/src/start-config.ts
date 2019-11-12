import { RouteBase } from './route/route-base';

export class StartConfig {
    public selector: string;
    public routes: RouteBase[];
    public useHash?: boolean = true;
}
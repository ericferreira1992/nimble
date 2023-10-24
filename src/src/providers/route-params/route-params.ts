import { Injectable } from '../../inject/injectable';
import { Route } from '../../route/route';

@Injectable()
export class RouteParams {

    // public readonly route: Route;
    public parent: RouteParams;
    public data: { [key: string]: any } = {};
    public params: { [key: string]: any } = {};
    public queryParams: { [key: string]: any } = {};

    constructor(){
    }
}
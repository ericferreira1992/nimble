import { RouteBase } from '@nimble-ts/core';
import { AuthRouteActivate } from './routes-activies/auth.route-activate';

export const ROUTES: RouteBase[] = [
    {
        path: 'login',
        routeActivate: [AuthRouteActivate],
        page: () => import('./pages/login/login.page').then(x => x.LoginPage)
    },
    {
        path: '',
        routeActivate: [AuthRouteActivate],
        page: () => import('./pages/root/root.page').then(x => x.RootPage),
        children: [
            {
                path: '',
                redirect: 'first',
            },
            {
                path: 'first',
                page: () => import('./pages/first/first.page').then(x => x.FirstPage)
            },
            {
                path: 'second',
                page: () => import('./pages/second/second.page').then(x => x.SecondPage)
            },
            {
                path: 'third',
                page: () => import('./pages/third/third.page').then(x => x.ThirdPage)
            }   
        ]
    }
];
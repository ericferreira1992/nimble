import { RouteBase } from '@nimble-ts/core';
import { AuthRouteActivate } from './routes-activies/auth.route-activate';

export const ROUTES: RouteBase[] = [
    {
        path: '',
        routeActivate: [AuthRouteActivate],
        page: () => import('./pages/root/root.page'),
        children: [
            {
                isPriority: true,
                path: 'first',
                page: () => import('./pages/first/first.page')
            },
            {
                path: 'second',
                page: () => import('./pages/second/second.page')
            },
            {
                path: 'third',
                page: () => import('./pages/third/third.page')
            }   
        ]
    }
];
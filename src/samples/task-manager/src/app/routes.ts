import { RouteBase } from '@nimble-ts/core';
import { AuthRouteActivate } from './services/auth/auth.route-activate';

export const ROUTES: RouteBase[] = [
    {
        path: '',
        routeActivate: [AuthRouteActivate],
        page: () => import('./pages/public/public.page'),
        children: [
            {
                isPriority: true,
                path: 'login',
                page: () => import('./pages/public/login/login.page')
            }
        ]
    },
    {
        path: '',
        routeActivate: [AuthRouteActivate],
        page: () => import('./pages/secured/secured.page'),
        children: [
            {
                isPriority: true,
                path: 'tasks',
                page: () => import('./pages/secured/tasks/tasks.page')
            }          
        ]
    }
];
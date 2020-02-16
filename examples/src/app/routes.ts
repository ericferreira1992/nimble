import { RouteBase } from '@nimble-ts/core';
import { AuthRouteActivate } from './services/auth/auth.route-activate';

export const ROUTES: RouteBase[] = [
    {
        path: '',
        routeActivate: [AuthRouteActivate],
        page: () => import('./pages/public/public.page').then(x => x.PublicPage),
        children: [
            {
                isPriority: true,
                path: 'login',
                page: () => import('./pages/public/login/login.page').then(x => x.LoginPage)
            }
        ]
    },
    {
        path: '',
        routeActivate: [AuthRouteActivate],
        page: () => import('./pages/secured/secured.page').then(x => x.SecuredPage),
        children: [
            {
                isPriority: true,
                path: 'tasks',
                page: () => import('./pages/secured/tasks/tasks.page').then(x => x.TasksPage)
            }          
        ]
    }
];
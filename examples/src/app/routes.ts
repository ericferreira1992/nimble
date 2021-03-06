import { RouteBase } from '@nimble-ts/core/route';
import { AuthRouteActivate } from './services/auth/auth.route-activate';

export const ROUTES: RouteBase[] = [
	{ path: '', redirect: 'login' },
    {
        path: '',
        guard: [AuthRouteActivate],
        page: () => import('./pages/public/public.page').then(x => x.PublicPage),
        children: [
            {
                path: 'login',
                page: () => import('./pages/public/login/login.page').then(x => x.LoginPage)
            }
        ]
    },
    {
        path: '',
        guard: [AuthRouteActivate],
        page: () => import('./pages/secured/secured.page').then(x => x.SecuredPage),
        children: [
            {
                path: 'tasks',
                page: () => import('./pages/secured/tasks/tasks.page').then(x => x.TasksPage)
            }          
        ]
    }
];
export const ROUTES = [
    {
        path: '',
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
        page: () => import('./pages/secured/secured.page'),
        children: [
            {
                isPriority: true,
                path: 'taks',
                page: () => import('./pages/secured/tasks/tasks.page')
            }          
        ]
    }
];
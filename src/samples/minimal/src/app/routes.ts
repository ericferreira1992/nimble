import { RouteBase } from '@nimble-ts/core';

export const ROUTES: RouteBase[] = [
    {
        path: '',
        page: () => import('./pages/root/root.page').then(x => x.RootPage),
        children: [
            {
                path: '',
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
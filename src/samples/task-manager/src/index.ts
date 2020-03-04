import { NimbleApp } from '@nimble-ts/core';
import { ROUTES } from './app/routes';
import './style.scss';

import { TasksService } from './app/services/tasks-service';
import { AuthService } from './app/services/auth/auth.service';
import { Helper } from './app/services/helper-service';

NimbleApp.config({
    routes: ROUTES,
    directives: [],
    providers: [
        TasksService,
        Helper,
        AuthService
    ]
}).start();
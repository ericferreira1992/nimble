import { NimbleApp } from '../../src/nimble';
import { ROUTES } from './app/routes';

import './style.scss';

NimbleApp.config({
    selector: '#app',
    routes: ROUTES,
    useHash: false
}).start();
import { MisticApp } from '../../src/mistic';
import { ROUTES } from './app/routes';

import './style.scss';

MisticApp.config({
    selector: '#app',
    routes: ROUTES
}).start();
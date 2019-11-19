import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import { Route } from './route/route';
import { StartConfig } from './start-config';
import { Router } from './route/router';
import { Render } from './render';
import { NimblePage } from './elements/nimble-page-element';
import { NimbleRouter } from './elements/nimble-router-element';
import { RouterEvent } from './route/router-event.enum';

export class NimbleApp {
    private static app: NimbleApp;
    public render: Render;

    public state: 'INITIALIZING' | 'INITIALIZED' = 'INITIALIZING';

    public rootElement: { virtual: HTMLElement, real: HTMLElement } = {
        real: null,
        virtual: null
    };

    public get routes() { return Router.routes; }

    constructor(public config: StartConfig) {
        this.defineRootElement();
        this.render = new Render(this);
        Router.app = this;
        Router.useHash = config.useHash;
        Router.defineRoutes(config.routes);
    }

    public static config(config: StartConfig){
        this.app = new NimbleApp(config);
        return this.app;
    }

    private defineRootElement() {
        this.rootElement.real = document.querySelector('nimble-root');
        if (this.rootElement.real) {
            this.rootElement.real.innerHTML = '';
            this.rootElement.real.style.removeProperty('visibility');
            this.rootElement.virtual = this.rootElement.real.cloneNode(true) as HTMLElement;
        }
        else {
            console.error(`Nimble not work, because the '<nimble-root></nimble-root>' element not found in body.`);
        }
    }

    public start() {
        this.registerElements();
        Router.addListener(RouterEvent.START_CHANGE, this.onRouteStartChange.bind(this));
        Router.addListener(RouterEvent.FINISHED_CHANGE, this.onRouteFinishedChange.bind(this));
        Router.addListener(RouterEvent.CHANGE_ERROR, this.onRouteChangeError.bind(this));
        Router.addListener(RouterEvent.STARTED_LOADING, this.onRouteStartedLoading.bind(this));
        Router.addListener(RouterEvent.FINISHED_LOADING, this.onRouteFinishedLoading.bind(this));
        Router.addListener(RouterEvent.ERROR_LOADING, this.onRouteErrorLoading.bind(this));
        Router.addListener(RouterEvent.STARTED_RERENDER, this.onRouteStartRerender.bind(this));
        Router.addListener(RouterEvent.FINISHED_RERENDER, this.onRouteFinishedRerender.bind(this));
        Router.start();
        this.state = 'INITIALIZED';
    }

    private registerElements() {
        window.customElements.define('nimble-page', NimblePage);
        window.customElements.define('nimble-router', NimbleRouter);
    }

    private onRouteStartChange(route: Route){
        let prevRoute = Router.previous;
        // console.log('');
        // console.log(`ROUTE START (/${prevRoute && prevRoute.completePath()} -> /${route.completePath()})`);
    }

    private onRouteFinishedChange(route: Route){
        let prevRoute = Router.previous;
        // console.log(`ROUTE FINISHED (/${prevRoute && prevRoute.completePath()} -> /${route.completePath()})`);
        this.render.resolveAndRenderRoute(route);
        document.dispatchEvent(new Event('render-event'))
        /* if (state !== RouterEvent.STARTED_RERENDER)
            this.render.resolveAndRenderRoute(route);
        else
            setTimeout(() => this.render.resolveAndRenderRoute(route)); */
    }

    private onRouteChangeError(route: Route){
        // console.log(`ROUTE ERROR! (/${route.completePath()})`);
    }

    private onRouteStartedLoading(route: Route){
        // console.log('LOADING...');
    }

    private onRouteFinishedLoading(route: Route){
        // console.log('LOADED!');
        this.renderRoute(route);
    }

    private onRouteErrorLoading(error, route: Route){
        // console.log(error);
    }

    private onRouteStartRerender(route: Route){
        // console.log('');
        // console.log(`RERENDER START: (/${route.completePath()})`);
    }

    private onRouteFinishedRerender(route: Route){
        // console.log(`RERENDER FINISHED: (/${route.completePath()})`);
        this.render.diffTreeElementsAndUpdateOld(this.rootElement.real, this.rootElement.virtual);
        document.dispatchEvent(new Event('render-event'))
    }

    public renderRoute(route: Route) {
        this.render.renderRoute(route);  
    }
}
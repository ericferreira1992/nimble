import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import { Route } from './route/route';
import { StartConfig } from './start-config';
import { Router } from './route/router';
import { NimblePage } from './elements/nimble-page-element';
import { NimbleRouter } from './elements/nimble-router-element';
import { RouterEvent } from './route/router-event.enum';
import { Directive } from './directives/abstracts/directive';
import { INTERNAL_DIRECTIVES } from './directives/internal-directives';
import { Type } from './inject/type.interface';
import { IterationDirective } from './directives/abstracts/iteration-directive';
import { Container } from './inject/container';
import { Render } from './render/render';
import { INTERNAL_PROVIDERS } from './providers/internal-providers';

export class NimbleApp {
    public static instance: NimbleApp;

    private render: Render;

    private containerInjector: Container = new Container();

    public state: NimbleAppState = NimbleAppState.INITIALIZING;

    public rootElement: { virtual: HTMLElement, real: HTMLElement } = {
        real: null,
        virtual: null
    };

    public directives: Type<Directive | IterationDirective>[] = [];
    private providers: Type<{}>[];

    public get routes() { return Router.routes; }

    constructor(private config: StartConfig) {
    }

    public static config(config: StartConfig) {
        if (!this.instance) {
            this.instance = new NimbleApp(config);
            this.instance.afterInstanciate();
        }
        return this.instance;
    }

    private afterInstanciate() {
        this.defineRootElement();
        this.registerDirectives();
        this.registerProvidersInContainerInjector();

        // Router
        Router.useHash = this.config.useHash;
        Router.registerRoutes(this.config.routes);

        this.render = this.containerInjector.inject(Render);
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

    private registerDirectives() {
        let directives = [...INTERNAL_DIRECTIVES];
        if (this.config.directives && this.config.directives.length > 0)
            directives = directives.concat(this.config.directives);

        directives.forEach((directive) => {
            try {
                directive.prototype.validate(this.directives);
                this.directives.push(directive);
            }
            catch(e) {
                console.error(e);
            }
        });
    }

    private registerProvidersInContainerInjector() {
        let providers = [...INTERNAL_PROVIDERS];
        if (this.config.providers && this.config.providers.length > 0)
            providers = providers.concat(this.config.providers);

        this.providers = providers;

        this.providers.forEach(service => {
            if (service.prototype.single)
                this.containerInjector.addProvider({ provide: service, useSingleton: service });
            else
                this.containerInjector.addProvider({ provide: service, useClass: service });
        });
    }

    public start() {
        if (this.state === NimbleAppState.INITIALIZING) {
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
            this.state = NimbleAppState.INITIALIZED;
        }
    }

    private registerElements() {
        window.customElements.define('nimble-page', NimblePage);
        window.customElements.define('nimble-router', NimbleRouter);
    }

    private onRouteStartChange(route: Route) {
        let prevRoute = Router.previous;
        // console.log('');
        // console.log(`ROUTE START (/${prevRoute && prevRoute.completePath()} -> /${route.completePath()})`);
    }

    private onRouteFinishedChange(route: Route) {
        let prevRoute = Router.previous;
        // console.log(`ROUTE FINISHED (/${prevRoute && prevRoute.completePath()} -> /${route.completePath()})`);
        this.render.resolveAndRenderRoute(route);
        document.dispatchEvent(new Event('render-event'))
        /* if (state !== RouterEvent.STARTED_RERENDER)
            this.render.resolveAndRenderRoute(route);
        else
            setTimeout(() => this.render.resolveAndRenderRoute(route)); */
    }

    private onRouteChangeError(route: Route) {
        // console.log(`ROUTE ERROR! (/${route.completePath()})`);
    }

    private onRouteStartedLoading(route: Route) {
        // console.log('LOADING...');
    }

    private onRouteFinishedLoading(route: Route) {
        // console.log('LOADED!');
        this.virtualizeRoute(route);
    }

    private onRouteErrorLoading(error, route: Route) {
        // console.log(error);
    }

    private onRouteStartRerender(route: Route) {
        // console.log('');
        // console.log(`RERENDER START: (/${route.completePath()})`);
    }

    private onRouteFinishedRerender(route: Route) {
        // console.log(`RERENDER FINISHED: (/${route.completePath()})`);
        // console.log(this.rootElement.real);
        // console.log(this.rootElement.virtual);
        this.render.diffTreeElementsAndUpdateOld(this.rootElement.real, this.rootElement.virtual);
        document.dispatchEvent(new Event('render-event'))
    }

    public virtualizeSequenceRoutes(routes: Route[]) {
        this.render.virtualizeSequenceRoutes(routes);
    }

    public virtualizeRoute(route: Route) {
        this.render.virtualizeRoute(route);
    }

    public static inject<T>(type: Type<T>): T {
        return this.instance.containerInjector.inject<T>(type);
    }
}

export enum NimbleAppState {
    INITIALIZING = 'INITIALIZING',
    INITIALIZED = 'INITIALIZED',
}
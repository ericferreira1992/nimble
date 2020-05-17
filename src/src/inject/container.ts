import {
    Provider,
    isClassProvider,
    isClassSingletonProvider,
    ClassProvider,
    ClassSingletonProvider,
    ValueProvider,
    FactoryProvider,
    isValueProvider,
    Token,
    InjectionToken
} from './provider';
import { Type } from './type.interface';
import { isInjectable } from "./injectable";
import "reflect-metadata";
import { getInjectionToken } from "./inject";

type InjectableParam = Type<any>;

const REFLECT_PARAMS = "design:paramtypes";

export class Container {
    private providers = new Map<Token<any>, Provider<any>>();

    addProvider<T>(provider: Provider<T>) {
        this.assertInjectableIfClassProvider(provider);
        this.providers.set(provider.provide, provider);
    }

    removeProvider<T>(provide: Token<T>) {
        if (this.providers.has(provide))
            this.providers.delete(provide);
    }

    inject<T>(type: Token<T>, onInstaciate?: (instance: any) => void): T {
        let provider = this.providers.get(type);
        if (provider === undefined && !(type instanceof InjectionToken)) {
            provider = { provide: type, useClass: type };
            this.assertInjectableIfClassProvider(provider);
        }
        return this.injectWithProvider(type, provider, onInstaciate);
    }

    private injectWithProvider<T>(type: Token<T>, provider?: Provider<T>, onInstaciate?: (instance: any) => void): T {
        if (provider === undefined) {
            throw new Error(`No provider for type ${this.getTokenName(type)}`);
        }

        if (isClassProvider(provider)) {
            let instance = this.injectClass(provider as ClassProvider<T>, onInstaciate);
            if (onInstaciate) onInstaciate(instance);
            return instance;
        }
        else if (isClassSingletonProvider(provider)) {
            let instance = this.injectSingleton(provider as ClassSingletonProvider<T>, onInstaciate);
            if (onInstaciate) onInstaciate(instance);
            return instance;
        }
        else if (isValueProvider(provider)) {
            return this.injectValue(provider as ValueProvider<T>);
        }
        else {
            // Factory provider by process of elimination
            return this.injectFactory(provider as FactoryProvider<T>);
        }
    }

    private assertInjectableIfClassProvider<T>(provider: Provider<T>) {
        if (isClassProvider(provider) && !isInjectable(provider.useClass)) {
            throw new Error(
                `Cannot provide ${this.getTokenName(
                    provider.provide
                )} using class ${this.getTokenName(
                    provider.useClass
                )}, ${this.getTokenName(provider.useClass)} isn't injectable`
            );
        }
    }

    private injectClass<T>(classProvider: ClassProvider<T>, onInstaciate?: (instance: any) => void): T {
        const target = classProvider.useClass;
        const params = this.getInjectedParams(target, onInstaciate);
        return Reflect.construct(target, params);
    }

    private injectSingleton<T>(classProvider: ClassSingletonProvider<T>, onInstaciate?: (instance: any) => void): T {
        if (!classProvider.instance) {
            const target = classProvider.useSingleton;
            const params = this.getInjectedParams(target, onInstaciate);
            classProvider.instance = Reflect.construct(target, params);
        }
        return classProvider.instance;
    }

    private injectValue<T>(valueProvider: ValueProvider<T>): T {
        return valueProvider.useValue;
    }

    private injectFactory<T>(valueProvider: FactoryProvider<T>): T {
        return valueProvider.useFactory();
    }

    private getInjectedParams<T>(target: Type<T>, onInstaciate?: (instance: any) => void) {
        const argTypes = Reflect.getMetadata(REFLECT_PARAMS, target) as (
            | InjectableParam
            | undefined)[];
        if (argTypes === undefined) {
            return [];
        }
        return argTypes.map((argType, index) => {
            // The reflect-metadata API fails on circular dependencies, and will return undefined
            // for the argument instead.
            if (argType === undefined) {
                throw new Error(
                    `Injection error. Recursive dependency detected in constructor for type ${
                    target.name
                    } with parameter at index ${index}`
                );
            }
            const overrideToken = getInjectionToken(target, index);
            const actualToken = overrideToken === undefined ? argType : overrideToken;
            let provider = this.providers.get(actualToken);
            return this.injectWithProvider(actualToken, provider, onInstaciate);
        });
    }

    private getTokenName<T>(token: Token<T>) {
        return token instanceof InjectionToken
            ? token.injectionIdentifier
            : token.name;
    }
}

import { Type } from "./type.interface";

export class InjectionToken {
    constructor(public injectionIdentifier: string) { }
}

export type Factory<T> = () => T;

export type Token<T> = Type<T> | InjectionToken;

export interface BaseProvider<T> {
    provide: Token<T>;
}

export interface ClassProvider<T> extends BaseProvider<T> {
    provide: Token<T>;
    useClass: Type<T>;
}
export interface ClassSingletonProvider<T> extends BaseProvider<T> {
    provide: Token<T>;
    useSingleton: Type<T>;
    instance?: T;
}
export interface ValueProvider<T> extends BaseProvider<T> {
    provide: Token<T>;
    useValue: T;
}
export interface FactoryProvider<T> extends BaseProvider<T> {
    provide: Token<T>;
    useFactory: Factory<T>;
}
export type Provider<T> =
    | ClassProvider<T>
    | ClassSingletonProvider<T>
    | ValueProvider<T>
    | FactoryProvider<T>;

export function isClassProvider<T>(
    provider: BaseProvider<T>
): provider is ClassProvider<T> {
    return (provider as any).useClass !== undefined;
}

export function isClassSingletonProvider<T>(
    provider: BaseProvider<T>
): provider is ClassSingletonProvider<T> {
    return (provider as any).useSingleton !== undefined;
}

export function isValueProvider<T>(
    provider: BaseProvider<T>
): provider is ValueProvider<T> {
    return (provider as any).useValue !== undefined;
}

export function isFactoryProvider<T>(
    provider: BaseProvider<T>
): provider is FactoryProvider<T> {
    return (provider as any).useFactory !== undefined;
}
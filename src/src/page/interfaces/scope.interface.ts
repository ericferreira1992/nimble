export interface IScope {
    eval(expression: string): any;
    onNeedRerender: (scope: any) => void;
}
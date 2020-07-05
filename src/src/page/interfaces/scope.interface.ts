export interface IScope {
    compile(expression: string): any;
    onNeedRerender: (scope: any) => void;
}
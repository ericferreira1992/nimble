export interface IScope {
    eval(expression: string): any;
    onNeedRerender: (page: any) => void;
}
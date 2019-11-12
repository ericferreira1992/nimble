export abstract class Page {
    public abstract template: string;

    public eval(expression: string): any {
        try {
            return (new Function(`with(this) { return ${expression} }`)).call(this);
        }
        catch(e) {
            if (e.message.includes('is not defined')) {
                return '';
            }
            throw e;
        }
    }
}
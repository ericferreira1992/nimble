export class HttpResponse<T> {
    xhr: XMLHttpRequest;
    status: number;
    data: T;

    constructor(obj: Partial<HttpResponse<T>>) {
        Object.assign(this, obj);
    }
}
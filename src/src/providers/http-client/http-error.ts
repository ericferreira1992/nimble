export class HttpError {
    xhr: XMLHttpRequest;
    status: number;
    error: any;

    constructor(obj: Partial<HttpError>) {
        Object.assign(this, obj);
    }
}
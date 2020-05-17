export class HttpOptions {
    headers?: { [header: string]: string; } | string[];
    params?: { [param: string]: string };
    responseType?: XMLHttpRequestResponseType = 'json';
    withCredentials?: boolean = false;
}
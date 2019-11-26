import { Injectable } from '../../inject/injectable';
import { HttpOptions } from './http-options';
import { HttpResponse } from './http-response';
import { isArray } from 'util';
import { HttpError } from './http-error';

@Injectable()
export class HttpClient {

    public get<T>(url: string, options?: HttpOptions): Promise<HttpResponse<T>> {
        return new Promise<HttpResponse<T>>((resolve, reject) => {
            this.prepreAndGetXHR('GET', url, null, options).then(
                (response: HttpResponse<T>) => {
                    resolve(response);
                },
                (error: { xhr: XMLHttpRequest, status: number, error: any }) => {
                    reject(error);
                }
            );
        });
    }

    public post<T>(url: string, body: any, options?: HttpOptions): Promise<HttpResponse<T>> {
        return new Promise<HttpResponse<T>>((resolve, reject) => {
            this.prepreAndGetXHR('POST', url, body, options).then(
                (response: HttpResponse<T>) => {
                    resolve(response);
                },
                (error: { xhr: XMLHttpRequest, status: number, error: any }) => {
                    reject(error);
                }
            );
        });
    }

    public put<T>(url: string, body: any, options?: HttpOptions): Promise<HttpResponse<T>> {
        return new Promise<HttpResponse<T>>((resolve, reject) => {
            this.prepreAndGetXHR('PUT', url, body, options).then(
                (response: HttpResponse<T>) => {
                    resolve(response);
                },
                (error: { xhr: XMLHttpRequest, status: number, error: any }) => {
                    reject(error);
                }
            );
        });
    }

    public patch<T>(url: string, body: any, options?: HttpOptions): Promise<HttpResponse<T>> {
        return new Promise<HttpResponse<T>>((resolve, reject) => {
            this.prepreAndGetXHR('PATCH', url, body, options).then(
                (response: HttpResponse<T>) => {
                    resolve(response);
                },
                (error: { xhr: XMLHttpRequest, status: number, error: any }) => {
                    reject(error);
                }
            );
        });
    }

    public del<T>(url: string, options?: HttpOptions): Promise<HttpResponse<T>> {
        return new Promise<HttpResponse<T>>((resolve, reject) => {
            this.prepreAndGetXHR('DEL', url, null, options).then(
                (response: HttpResponse<T>) => {
                    resolve(response);
                },
                (error: { xhr: XMLHttpRequest, status: number, error: any }) => {
                    reject(error);
                }
            );            
        });
    }

    private prepreAndGetXHR(method: string, url: string, body: any, options: HttpOptions): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let client = new XMLHttpRequest();

            let urlWithParams = options ? this.getUrlWithParams(url, options.params) : url;

            if (!options) options = new HttpOptions();

            client.withCredentials = options.withCredentials;
            if (options.responseType) client.responseType = options.responseType;
            this.setHeaders(client, options.headers);

            client.open(method, urlWithParams, true);
            client.onreadystatechange = function () {
                if (client.readyState == 4) {
                    let response = {
                        xhr: client,
                        status: client.status
                    } as any;
                    if (client.status == 200) {
                        response.data = client.response;
                        let object = new HttpResponse(response);
                        resolve(object);
                    } else {
                        response.error = client.response;
                        let object = new HttpResponse(response);
                        reject(object);
                    }
                }
            };
            client.onerror = function () {
                reject(new HttpError({
                    xhr: client,
                    status: client.status,
                    error: client.response
                }));
            };

            client.send(body);
        });
    }

    private setHeaders(client: XMLHttpRequest, headers: { [key: string]: string; } | string[]) {
        if (headers) {
            if (isArray(headers)) {
                for(let key of headers)
                    client.setRequestHeader(key, '');
            }
            else {
                for(let key in headers)
                    client.setRequestHeader(key, (headers as {[header: string]: string})[key]);
            }
        }
    }

    private getUrlWithParams(url: string, params: { [key: string]: string; }) {
        if (params && url) {
            for(let paramName in params) {
                let value = params[paramName];
                if (!url.includes('?'))
                    url += `?${paramName}=${value}`;
                else
                    url += `&${paramName}=${value}`;
            }
        }
        return url;
    }

}
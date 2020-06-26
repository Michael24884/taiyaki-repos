
import CookieManager, { Cookies } from '@react-native-community/cookies';
import axios, { AxiosInstance } from 'axios';

export interface GlobalAnimeLink {
    title: string;
    image: string;
    link: string;
}

export interface ServerItems {
    server: string;
    link: string;
}

export interface SourceExtras {
    usesCloudflare: boolean,
    customHeaders: Object | undefined,
    timeout: number | undefined,
    maxRedirects: number | undefined,
}

export interface Data {
    version: string;
    name: string;
    baseURL: string;
    image?: string;
    description?: string;
    developer?: string;
    extra?: SourceExtras;
}

//Just extend a source class with Base
export default abstract class Base {
    /**
    * data is converted into JSON File 
    */

    abstract data: Data;


    abstract notificationTasks(link: string): Promise<number>
    /**
     * Responsible for searching anime, usually will contain the query in the url
     * 
     * @param title  the title of the anime
     */
    abstract returnScrapedTitles(title: string): Promise<Array<GlobalAnimeLink>>;

    /**
     * 
     * @param link the link to the episode
     */
    abstract returnAvailableEpisodes(link: string): Promise<Array<string>>;
    abstract availableServers(episodeLink: string): Promise<Array<ServerItems>>;







    /**
     No need to modify below this block but if you know what you're doing, feel free to edit and/or improvise
     */
     get dataToJson(): string {
        return JSON.stringify(this.data);
    }

    protected get binder(): Base {
        return this;
    }

    private _defaultHeaders = {
        "user-agent": "	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36 OPR/69.0.3686.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9",
    }

    protected get instance(): AxiosInstance {
        const { customHeaders, timeout, maxRedirects } = this.data.extra;

        const _request = axios.create({
            baseURL: this.data.baseURL,
            headers: customHeaders != null ? { ...customHeaders, ...this._defaultHeaders } : this._defaultHeaders,
            timeout: timeout || 5000,
            maxRedirects: maxRedirects || 4,
        });
        _request.interceptors.request.use(async (config) => {
            if (this.data.extra.usesCloudflare)
                config.headers["cookie"] = this._setCookies();
            try {
                config.url = this._enforceHTTPS(config.url);
                return config;
            } catch (error) {
                console.error(error.toString());
            }
        });

        return _request;
    };


    private _enforceHTTPS = (url: string): string => {
        if (url.substring(0, 4) != "https") {
            const _protocol: RegExp = RegExp(/(\/\/.+)/g);
            const _match = url.match(_protocol);
            if (_match) return `https://${_match[0].substring(2)}`;
            else throw ("A valid url could not be parsed");
        }
        return url;
    }

    private _setCookies = async (): Promise<string> => {
        let cookie = ''
        const _cookies: Cookies = await CookieManager.get(this.data.baseURL)
        if (_cookies) {
            cookie += `cf_clearance=${_cookies['cf_clearance']['value']}; `
            cookie += `_ga=${_cookies['_ga']['value']}; `
            cookie += `__cfduid=${_cookies['__cfduid']['value']}; `
        }
        return cookie
    }
}
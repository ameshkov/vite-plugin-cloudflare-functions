import { AxiosRequestConfig, AxiosResponse } from 'axios';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
interface PagesResponseBody {
}
type MiddlewareOf<Route extends string, Method extends HttpMethod> = Exclude<PagesResponseBody[MatchedRoutes<Route>] extends never ? never : PagesResponseBody[MatchedRoutes<Route>] extends {
    ALL: infer R;
} ? R : PagesResponseBody[MatchedRoutes<Route>][Method], Error | void>;
type TypedResponse<Route, Method extends HttpMethod, Default = unknown> = Default extends string | boolean | number | null | void | object ? Default : Route extends string ? MiddlewareOf<Route, Method> extends never ? any : MiddlewareOf<Route, Method> : any;
type MatchResult<Key extends string, Exact extends boolean = false, Score extends any[] = []> = {
    [k in Key]: {
        key: k;
        exact: Exact;
        score: Score;
    };
}[Key];
type Subtract<Minuend extends any[] = [], Subtrahend extends any[] = []> = Minuend extends [
    ...Subtrahend,
    ...infer Remainder
] ? Remainder : never;
type TupleIfDiff<First extends string, Second extends string, Tuple extends any[] = []> = First extends `${Second}${infer Diff}` ? (Diff extends '' ? [] : Tuple) : [];
type MaxTuple<N extends any[] = [], T extends any[] = []> = {
    current: T;
    result: MaxTuple<N, ['', ...T]>;
}[[N['length']] extends [Partial<T>['length']] ? 'current' : 'result'];
type CalcMatchScore<Key extends string, Route extends string, Score extends any[] = [], Init extends boolean = false, FirstKeySegMatcher extends string = Init extends true ? ':Invalid:' : ''> = `${Key}/` extends `${infer KeySeg}/${infer KeyRest}` ? KeySeg extends FirstKeySegMatcher ? Subtract<[...Score, ...TupleIfDiff<Route, Key, ['', '']>], TupleIfDiff<Key, Route, ['', '']>> : `${Route}/` extends `${infer RouteSeg}/${infer RouteRest}` ? RouteSeg extends KeySeg ? CalcMatchScore<KeyRest, RouteRest, [...Score, '', '']> : KeySeg extends `:${string}` ? RouteSeg extends '' ? never : CalcMatchScore<KeyRest, RouteRest, [...Score, '']> : KeySeg extends RouteSeg ? CalcMatchScore<KeyRest, RouteRest, [...Score, '']> : never : never : never;
type _MatchedRoutes<Route extends string, MatchedResultUnion extends MatchResult<string> = MatchResult<keyof PagesResponseBody>> = MatchedResultUnion['key'] extends infer MatchedKeys ? MatchedKeys extends string ? Route extends MatchedKeys ? MatchResult<MatchedKeys, true> : MatchedKeys extends `${infer Root}/**${string}` ? MatchResult<MatchedKeys, false, CalcMatchScore<Root, Route, [], true>> : MatchResult<MatchedKeys, false, CalcMatchScore<MatchedKeys, Route, [], true>> : never : never;
type MatchedRoutes<Route extends string, MatchedKeysResult extends MatchResult<string> = MatchResult<keyof PagesResponseBody>, Matches extends MatchResult<string> = _MatchedRoutes<Route, MatchedKeysResult>> = Extract<Matches, {
    exact: true;
}> extends never ? Extract<Exclude<Matches, {
    score: never;
}>, {
    score: MaxTuple<Matches['score']>;
}>['key'] : Extract<Matches, {
    exact: true;
}>['key'];

declare function useFunctions(config?: AxiosRequestConfig<any>): {
    get<T = unknown, D = any, Route extends string = string>(url: Route, config?: AxiosRequestConfig<D>): Promise<TypedResponse<Route, "GET", T>>;
    post<T = unknown, D = any, Route extends string = string>(url: Route, data?: D, config?: AxiosRequestConfig<D>): Promise<TypedResponse<Route, "POST", T>>;
    put<T = unknown, D = any, Route extends string = string>(url: Route, data?: D, config?: AxiosRequestConfig<D>): Promise<TypedResponse<Route, "PUT", T>>;
    patch<T = unknown, D = any, Route extends string = string>(url: Route, data?: D, config?: AxiosRequestConfig<D>): Promise<TypedResponse<Route, "PATCH", T>>;
    delete<T = unknown, D = any, Route extends string = string>(url: Route, config?: AxiosRequestConfig<D>): Promise<TypedResponse<Route, "DELETE", T>>;
    head<T = unknown, D = any, Route extends string = string>(url: Route, config?: AxiosRequestConfig<D>): Promise<TypedResponse<Route, "HEAD", T>>;
    options<T = unknown, D = any, Route extends string = string>(url: Route, config?: AxiosRequestConfig<D>): Promise<TypedResponse<Route, "OPTIONS", T>>;
    raw: {
        get<T = unknown, D = any, Route extends string = string>(url: Route, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<TypedResponse<Route, "GET", T>, D>>;
        post<T = unknown, D = any, Route extends string = string>(url: Route, data?: D, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<TypedResponse<Route, "POST", T>, D>>;
        put<T = unknown, D = any, Route extends string = string>(url: Route, data?: D, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<TypedResponse<Route, "PUT", T>, D>>;
        patch<T = unknown, D = any, Route extends string = string>(url: Route, data?: D, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<TypedResponse<Route, "PATCH", T>, D>>;
        delete<T = unknown, D = any, Route extends string = string>(url: Route, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<TypedResponse<Route, "DELETE", T>, D>>;
        head<T = unknown, D = any, Route extends string = string>(url: Route, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<TypedResponse<Route, "HEAD", T>, D>>;
        options<T = unknown, D = any, Route extends string = string>(url: Route, config?: AxiosRequestConfig<D>): Promise<AxiosResponse<TypedResponse<Route, "OPTIONS", T>, D>>;
    };
};

export { type PagesResponseBody, type TypedResponse, useFunctions };

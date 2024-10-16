declare class CloudflareResponse<T = any> extends Response {
}
type CloudflareResponseBody<T extends (...args: any[]) => any> = Awaited<ReturnType<T>> extends CloudflareResponse<infer R> ? R : never;
type CloudflarePagesFunction<T = unknown, Env = unknown, Params extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> = (context: Parameters<PagesFunction<Env, Params, Data>>[0]) => T | Promise<T>;

interface PagesFunctionEnv {
}
interface PagesFunctionData extends Record<string, unknown> {
}
declare function makeRawPagesFunction<T = unknown, Env = PagesFunctionEnv, Params extends string = any, Data extends Record<string, unknown> = PagesFunctionData>(fn: CloudflarePagesFunction<CloudflareResponse<T>, Env, Params, Data>): CloudflarePagesFunction<CloudflareResponse<T>, Env, Params, Data>;
declare function makePagesFunction<T = unknown, Env = PagesFunctionEnv, Params extends string = any, Data extends Record<string, unknown> = PagesFunctionData>(fn: CloudflarePagesFunction<T, Env, Params, Data>): CloudflarePagesFunction<CloudflareResponse<T>, Env, Params, Data>;
declare function makeRawResponse<T extends BodyInit | null | undefined>(body: T, init?: ResponseInit): CloudflareResponse<T>;
declare function makeResponse<T = any>(body: T, init?: ResponseInit): CloudflareResponse<T extends CloudflareResponse<infer R> ? R : T>;

export { type CloudflarePagesFunction, CloudflareResponse, type CloudflareResponseBody, type PagesFunctionData, type PagesFunctionEnv, makePagesFunction, makeRawPagesFunction, makeRawResponse, makeResponse };

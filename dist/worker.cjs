'use strict';

class CloudflareResponse extends Response {
}

function makeRawPagesFunction(fn) {
  return fn;
}
function makePagesFunction(fn) {
  return async (context) => makeResponse(await fn(context));
}
function makeRawResponse(body, init = {}) {
  return new CloudflareResponse(body, init);
}
function makeResponse(body, init = {}) {
  if (body instanceof Response || body instanceof CloudflareResponse) {
    return body;
  } else {
    return new CloudflareResponse(JSON.stringify(body), {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers }
    });
  }
}

exports.CloudflareResponse = CloudflareResponse;
exports.makePagesFunction = makePagesFunction;
exports.makeRawPagesFunction = makeRawPagesFunction;
exports.makeRawResponse = makeRawResponse;
exports.makeResponse = makeResponse;

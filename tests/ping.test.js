const ping = require('../edp/api/ping');

describe('GET /api/ping', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      _headers: {},
      _status: null,
      _json: null,
      setHeader(key, val) { this._headers[key] = val; },
      status(code) { this._status = code; return this; },
      json(body) { this._json = body; },
    };
  });

  test('responds with 200 status', () => {
    ping(req, res);
    expect(res._status).toBe(200);
  });

  test('sets CORS header to allow all origins', () => {
    ping(req, res);
    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
  });

  test('sets Content-Type to application/json', () => {
    ping(req, res);
    expect(res._headers['Content-Type']).toBe('application/json');
  });

  test('response body contains ok and pong flags', () => {
    ping(req, res);
    expect(res._json.ok).toBe(true);
    expect(res._json.pong).toBe(true);
  });

  test('response body contains a valid ISO time string', () => {
    ping(req, res);
    expect(typeof res._json.time).toBe('string');
    expect(new Date(res._json.time).toISOString()).toBe(res._json.time);
  });
});

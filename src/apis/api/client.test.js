import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";

import { apiClient } from "./client.js";
import { clearAuthSession, getAuthSession, setAuthSession } from "./storage.js";

const createLocalStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

const createJwt = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
};

const setupBrowserGlobals = () => {
  globalThis.localStorage = createLocalStorage();
  globalThis.window = {
    location: {
      pathname: "/dashboard",
      replace: (nextPath) => {
        globalThis.window.location.pathname = nextPath;
      },
    },
    dispatchEvent: () => {},
  };
  globalThis.Event = class {
    constructor(type) {
      this.type = type;
    }
  };
  if (!globalThis.atob) {
    globalThis.atob = (value) => Buffer.from(value, "base64").toString("binary");
  }
};

const mockJsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: () => "application/json",
  },
  json: async () => body,
});

test.beforeEach(() => {
  setupBrowserGlobals();
  clearAuthSession();
  globalThis.fetch = undefined;
});

test("apiClient attaches bearer token for authenticated requests", async () => {
  const accessToken = createJwt({
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: "admin",
    email: "admin@example.com",
  });
  setAuthSession({ accessToken, refreshToken: "refresh-token", role: "admin", email: "admin@example.com" });

  let requestHeaders = {};
  globalThis.fetch = async (_url, options) => {
    requestHeaders = options.headers || {};
    return mockJsonResponse(200, { ok: true });
  };

  const response = await apiClient.get("/mentees/");
  assert.deepEqual(response, { ok: true });
  assert.equal(requestHeaders.Authorization, `Bearer ${accessToken}`);
});

test("apiClient sends JSON content-type and body on post", async () => {
  let capturedOptions = null;
  globalThis.fetch = async (_url, options) => {
    capturedOptions = options;
    return mockJsonResponse(200, { created: true });
  };

  await apiClient.post("/mentee-requests/", { mood: "Anxious" }, { auth: false });

  assert.equal(capturedOptions.method, "POST");
  assert.equal(capturedOptions.headers["Content-Type"], "application/json");
  assert.equal(capturedOptions.body, JSON.stringify({ mood: "Anxious" }));
});

test("apiClient clears auth session and redirects to /login on 401", async () => {
  const accessToken = createJwt({
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: "mentor",
    email: "mentor@example.com",
  });
  setAuthSession({ accessToken, refreshToken: "refresh-token", role: "mentor", email: "mentor@example.com" });

  globalThis.fetch = async () => mockJsonResponse(401, { detail: "Unauthorized" });

  await assert.rejects(() => apiClient.get("/sessions/"), { message: "Unauthorized" });
  assert.equal(getAuthSession(), null);
  assert.equal(globalThis.window.location.pathname, "/login");
});

test("apiClient uses auth=false requests without Authorization header", async () => {
  let requestHeaders = {};
  globalThis.fetch = async (_url, options) => {
    requestHeaders = options.headers || {};
    return mockJsonResponse(200, { ok: true });
  };

  await apiClient.post("/login/", { email: "a@example.com", password: "x" }, { auth: false });
  assert.equal("Authorization" in requestHeaders, false);
});

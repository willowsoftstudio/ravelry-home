import { test } from "@playwright/test";

// ISA ISC-3 (browser half): after a mocked sign-in, no token appears in
// localStorage, sessionStorage, document.cookie or browser-bound responses,
// and the session cookie is HttpOnly, Secure and SameSite=Lax.
// Pending: needs the OAuth sign-in and session routes (ISC-17, ISC-20, ISC-65).
test.fixme("no OAuth token reaches the browser after sign-in (pending F2 sign-in)", async () => {});

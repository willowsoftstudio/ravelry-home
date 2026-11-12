# Bug report for api@ravelry.com: OAuth 2.1 login step returns 500 for a signed-in user

**To:** api@ravelry.com
**Subject:** OAuth 2.1: `/auth/login?login_challenge=…` returns 500 when the user is already logged in

Hello,

We're building a small private, non-commercial client on the Ravelry API, and we hit a server error in the new OAuth 2.1 flow.

- **Client ID:** `5364216562ec79032e72c6ae73124440` (OAuth 2.1 key)
- **Redirect URI:** `https://localhost:3000/api/auth/callback` (registered)
- **When:** Thu, 12 Nov 2026 01:18:25 GMT (several earlier attempts on 2026-11-11 too)

**Steps**

1. While logged in to www.ravelry.com in the browser, open
   `https://auth.ravelry.com/oauth2/auth?response_type=code&client_id=5364216562ec79032e72c6ae73124440&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback&scope=offline_access+forum-write+message-write+deliveries-read&state=…&code_challenge=…&code_challenge_method=S256`
2. auth.ravelry.com answers **302** to `https://www.ravelry.com/auth/login?login_challenge=…` (as expected).
3. That `GET /auth/login?login_challenge=…` answers **500 Internal Server Error** (text/html, nginx). The user never sees a login or consent screen.

**What we observed**

- The same request with **no** Ravelry session redirects correctly to `/account/login`, and after logging in there, the flow completed once and returned a code to our callback.
- With an existing Ravelry session it fails every time, with the full scope list and with `scope=offline_access` alone.
- It also fails after logging out of www.ravelry.com first and logging in again during the flow (2026-11-12), so it is not only a stale-session problem. The single success on 2026-11-11 is the exception.
- The logged-in session in our failing attempts had been on the Pro/developer pages (a business/pro session), in case that matters.
- Nothing appears in the app's API debug log, presumably because the failure happens before any API call.

**Expected:** a logged-in user is either passed through to consent or shown the login form, not a 500.

Thanks for the API, and for any help.

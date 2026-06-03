# Frontend Environment

Create `Yeoginamgim-Front/react/.env` for local frontend development.

Current LAN IP confirmed with `ipconfig`: `192.168.219.150`

```env
VITE_API_BASE_URL=http://192.168.219.150:8080
VITE_KAKAO_JAVASCRIPT_KEY=<Kakao JavaScript key>
```

Only public frontend values should be stored here. Do not put Kakao REST API keys,
OAuth client secrets, JWT secrets, passwords, or other server-side secrets in the
frontend environment file.

## LAN Device Testing

Run the Vite dev server so other devices on the same network can reach it:

```powershell
npm run dev
```

`package.json` already uses `vite --host 0.0.0.0` for the `dev` script. If the
script is changed later, use this equivalent command:

```powershell
npm run dev -- --host 0.0.0.0
```

Test URLs:

```text
Frontend: http://192.168.219.150:5173
Backend:  http://192.168.219.150:8080
```

If the PC LAN IP changes, update these together:

- `Yeoginamgim-Front/react/.env`: `VITE_API_BASE_URL`
- `Yeoginamgim-Back/src/main/resources/application.properties`: `app.frontend-base-url`
- Kakao Developers Web domain and OAuth redirect URI entries

## Backend CORS and OAuth Redirects

`WebConfig` allows the origin from `app.frontend-base-url`, plus localhost
origins for same-PC development. For LAN testing, keep:

```properties
app.frontend-base-url=http://192.168.219.150:5173
```

This value is also used by the backend after OAuth login to redirect the browser
back to the frontend callback route.

OAuth provider redirect URI values are usually stored in backend local secret
properties. Do not print or commit those secrets. For LAN OAuth testing, ensure
the Kakao redirect URI configured in the backend and in Kakao Developers both
match the backend callback URL, for example:

```text
http://192.168.219.150:8080/api/auth/oauth/kakao/callback
```

## Kakao Developers Checklist

In Kakao Developers, update the app settings manually:

- Platform > Web > Site domain: add `http://192.168.219.150:5173`
- Kakao Login > Redirect URI: confirm it matches the backend callback URL

## Browser Location API

Current-location features are most reliable on `localhost` or HTTPS secure
origins. Plain HTTP LAN origins such as `http://192.168.219.150:5173` may be
restricted by browser security policy, especially on mobile browsers.

For mobile testing that includes current location, prefer an HTTPS tunnel such
as ngrok or cloudflared and register that HTTPS origin in Kakao Developers.

## Windows Firewall

Allow inbound TCP access to these local development ports:

```text
5173 - Vite frontend
8080 - Spring Boot backend
```

Changing Windows Firewall rules requires Administrator permission. Do not run
firewall commands unless the user explicitly approves them.

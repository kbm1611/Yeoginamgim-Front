# Frontend Environment

Create `Yeoginamgim-Front/react/.env` for local frontend development.

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_KAKAO_JAVASCRIPT_KEY=카카오_JavaScript_Key
```

Only public frontend values should be stored here. Do not put Kakao REST API keys,
OAuth client secrets, JWT secrets, passwords, or other server-side secrets in the
frontend environment file.

For local Kakao Map development, register the exact browser origin in the Kakao
Developers app under **Platform > Web > Site domain**. Common local origins are:

```text
http://localhost:5173
http://127.0.0.1:5173
```

If Vite starts on a different port, register that origin too.

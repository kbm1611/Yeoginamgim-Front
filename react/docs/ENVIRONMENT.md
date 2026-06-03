# Frontend Environment

Create `Yeoginamgim-Front/react/.env` for local frontend development.

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_KAKAO_JAVASCRIPT_KEY=카카오_JavaScript_Key
```

Only public frontend values should be stored here. Do not put Kakao REST API keys,
OAuth client secrets, JWT secrets, passwords, or other server-side secrets in the
frontend environment file.

# NetFrame — Creative HTTP Server (PS #1)

A small Express-like HTTP framework built using only Node.js [`net`](https://nodejs.org/api/net.html). No `http` module, no third-party HTTP libraries.

**Course:** Full Stack Engineering • Reichman University  
**Problem Set:** [#1 — Creative HTTP Server](https://full-stack-lectures.vercel.app/)

---

## Quick start

Requires Node.js 18+.

```bash
git clone https://github.com/aradwe/fullstack-ps1.git
cd fullstack-ps1
npm start
```

Open [http://localhost:3000/static/index.html](http://localhost:3000/static/index.html) in your browser.

---

## Example usage

```javascript
import { createApp, json, logger, serveStatic } from './src/index.js';

const app = createApp();

app.use('json', json());
app.use('logger', logger());
app.use('/static', 'static', serveStatic('public'));

app.get('/', (req, res) => res.redirect('/static/index.html'));

app.group('/api', (api) => {
  api.get('/hello', (req, res) => res.json({ message: 'Hello, World!' }));

  api.get('/users/:id', (req, res) => {
    res.json({ id: req.params.id, name: 'User ' + req.params.id });
  });

  api.post('/users', (req, res) => {
    const { name, email } = req.body;
    res.status(201).json({ id: Date.now(), name, email, created: true });
  });
});

app.listen(3000);
```

See [`examples/demo-server.js`](examples/demo-server.js) for the full runnable demo.

---

## API reference

### `createApp()`

Returns an app instance with routing, middleware, and a TCP server.

### Middleware

| Function | Description |
|----------|-------------|
| `app.use(handler)` | Register middleware for all paths |
| `app.use(name, handler)` | Named middleware (shown in logs) |
| `app.use('/prefix', handler)` | Middleware for paths under a prefix |
| `app.use('/prefix', name, handler)` | Named + mounted middleware |
| `json()` | Parse JSON request bodies into `req.body` |
| `logger()` | Colored request logs + `X-Response-Time` header |
| `serveStatic(rootDir)` | Serve static files from a directory |

### Routing

| Method | Description |
|--------|-------------|
| `app.get(path, handler)` | Register GET route |
| `app.post(path, handler)` | Register POST route |
| `app.put/delete/patch(path, handler)` | Other HTTP methods |
| `app.group('/prefix', fn)` | Group routes under a path prefix |

Path params: `/users/:id` → `req.params.id`

### Server

| Method | Description |
|--------|-------------|
| `app.listen(port, callback?)` | Start TCP server; prints route table; registers `GET /__routes` |
| `app.getRouteManifest()` | Returns `[{ method, path }, ...]` |

### Request object (`req`)

| Field | Description |
|-------|-------------|
| `method` | HTTP method |
| `path` | URL path (no query string) |
| `query` | Parsed query string object |
| `params` | Route params from `:segments` |
| `headers` | Request headers (lowercase keys) |
| `rawBody` | Raw body string |
| `body` | Parsed JSON (after `json()` middleware) |

### Response object (`res`)

| Method | Description |
|--------|-------------|
| `res.status(code)` | Set status code (chainable) |
| `res.set(key, value)` | Set response header |
| `res.send(text)` | Plain text response |
| `res.json(data)` | JSON response |
| `res.html(content)` | HTML response |
| `res.redirect(url, code?)` | Redirect (default 302) |
| `res.sendFile(path, stats)` | Stream a file |
| `res.end()` | Empty response |

---

## Design choices

1. **`net` only** — HTTP/1.1 is implemented manually to understand what frameworks do under the hood.
2. **Express-like API** — familiar `app.get`, `app.use`, middleware with `next()`.
3. **`Connection: close`** — one request per TCP connection; simpler to implement and debug.
4. **Streaming static files** — large files are piped to the socket instead of loaded into memory.
5. **Path traversal guard** — resolved file paths must stay inside the static root directory.
6. **Incremental body parsing** — the parser buffers until `Content-Length` bytes arrive.

---

## Creative features

- **Named middleware registry** — `app.use('logger', logger())`; names appear in request logs
- **Request logger** — colored terminal output: `[time] GET /path → 200 (3ms) [json → logger]`
- **`X-Response-Time` header** — on every response
- **Route groups** — `app.group('/api', api => ...)` for cleaner route organization
- **Route discovery** — `GET /__routes` returns a JSON manifest of registered routes
- **Startup route table** — printed to console when the server starts
- **Redirects** — `res.redirect(url)` helper

---

## Project structure

```
ps1-http-server/
├── src/
│   ├── index.js       # Public exports
│   ├── app.js         # App, middleware pipeline, groups
│   ├── server.js      # TCP server wrapper
│   ├── parser.js      # HTTP request parsing
│   ├── response.js    # HTTP response builder
│   ├── router.js      # Route matching
│   ├── static.js      # Static file middleware
│   ├── middleware.js  # json(), logger()
│   ├── mime.js        # MIME types
│   └── statusCodes.js # Status phrases
├── examples/
│   ├── demo-server.js # Main demo (npm start)
│   └── smoke-*.js     # Step-by-step test scripts
└── public/            # Static demo assets
```

---

## Testing

Start the server:

```bash
npm start
```

| Test | Command |
|------|---------|
| GET route | `curl.exe -s http://localhost:3000/api/hello` |
| POST route | See **Windows (PowerShell)** below |
| Param route | `curl.exe -s http://localhost:3000/api/users/42` |
| Static file | `curl.exe -i http://localhost:3000/static/index.html` |
| 404 | `curl.exe -s http://localhost:3000/nope` |
| Route manifest | `curl.exe -s http://localhost:3000/__routes` |

### Windows (PowerShell)

Use `curl.exe` (not the `curl` alias). **Do not** use bash-style `-d "{\"name\":...}"` — PowerShell mangles the quotes and curl may return `(3) URL rejected: Bad hostname` while the server receives invalid JSON.

**Option A — JSON file (run from `ps1-http-server/` directory):**

```powershell
cd ps1-http-server
curl.exe -s -X POST -H "Content-Type: application/json" --data-binary "@examples/post-body.json" http://localhost:3000/api/users
```

**Option B — `Invoke-RestMethod` (works from any directory):**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/users -Method POST -ContentType "application/json" -Body '{"name":"Alice","email":"a@b.com"}'
```

Traversal test (use `--path-as-is` so curl does not normalize `..`):

```powershell
curl.exe -i --path-as-is "http://localhost:3000/static/../../etc/passwd"
```

Expected: `403 Forbidden`

---

## Limitations

- One request per connection (`Connection: close`; no keep-alive)
- No HTTPS/TLS
- No chunked transfer encoding
- No multipart form uploads
- No WebSockets
- JSON body parser only (no urlencoded forms on the server side)

---

## Author

Arad Weinstein

import { createRouter } from './router.js';
import { createNetServer } from './server.js';

export function createApp() {
  const router = createRouter();
  const middlewareStack = [];

  function use(mountPathOrHandler, ...handlers) {
    if (typeof mountPathOrHandler === 'function') {
      middlewareStack.push({ mountPath: null, handler: mountPathOrHandler });
      return;
    }

    const mountPath = mountPathOrHandler;
    for (const handler of handlers) {
      middlewareStack.push({ mountPath, handler });
    }
  }

  function dispatchRoute(req, res) {
    const matched = router.match(req.method, req.path);

    if (!matched) {
      res.status(404).json({ error: 'Not Found' });
      return;
    }

    req.params = matched.params;

    try {
      matched.handler(req, res);
    } catch (err) {
      console.error('Route handler error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  function runMiddleware(index, req, res) {
    if (index >= middlewareStack.length) {
      dispatchRoute(req, res);
      return;
    }

    const { mountPath, handler } = middlewareStack[index];

    if (mountPath && !req.path.startsWith(mountPath)) {
      runMiddleware(index + 1, req, res);
      return;
    }

    try {
      const reqForMiddleware = mountPath
        ? { ...req, path: req.path.slice(mountPath.length) || '/' }
        : req;

      handler(reqForMiddleware, res, () => runMiddleware(index + 1, req, res));
    } catch (err) {
      console.error('Middleware error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  function handle(req, res) {
    runMiddleware(0, req, res);
  }

  function listen(port, callback) {
    const server = createNetServer(handle);
    server.listen(port, callback);
  }

  return {
    use,
    get(path, handler) {
      router.get(path, handler);
    },
    post(path, handler) {
      router.post(path, handler);
    },
    put(path, handler) {
      router.put(path, handler);
    },
    delete(path, handler) {
      router.delete(path, handler);
    },
    patch(path, handler) {
      router.patch(path, handler);
    },
    handle,
    listen,
  };
}

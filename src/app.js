import { createRouter } from './router.js';
import { createNetServer } from './server.js';

function createGroupApp(groupRouter) {
  return {
    get(path, handler) {
      groupRouter.get(path, handler);
    },
    post(path, handler) {
      groupRouter.post(path, handler);
    },
    put(path, handler) {
      groupRouter.put(path, handler);
    },
    delete(path, handler) {
      groupRouter.delete(path, handler);
    },
    patch(path, handler) {
      groupRouter.patch(path, handler);
    },
  };
}

function parseUseArgs(args) {
  let mountPath = null;
  let name = null;
  let handlers = [];

  if (args.length === 0) {
    return { mountPath, name, handlers };
  }

  if (typeof args[0] === 'function') {
    handlers = [args[0]];
    return { mountPath, name, handlers };
  }

  if (typeof args[0] !== 'string') {
    return { mountPath, name, handlers };
  }

  if (args.length === 2 && typeof args[1] === 'function') {
    if (args[0].startsWith('/')) {
      mountPath = args[0];
      handlers = [args[1]];
    } else {
      name = args[0];
      handlers = [args[1]];
    }
    return { mountPath, name, handlers };
  }

  if (args.length >= 3 && typeof args[1] === 'string' && typeof args[2] === 'function') {
    mountPath = args[0];
    name = args[1];
    handlers = [args[2]];
    return { mountPath, name, handlers };
  }

  return { mountPath, name, handlers };
}

export function createApp() {
  const router = createRouter();
  const middlewareStack = [];

  function use(...args) {
    const { mountPath, name, handlers } = parseUseArgs(args);

    for (const handler of handlers) {
      middlewareStack.push({ mountPath, name, handler });
    }
  }

  function getRouteManifest() {
    return router.listRoutes();
  }

  function printRouteTable() {
    const routes = getRouteManifest();

    if (routes.length === 0) {
      console.log('Registered routes: (none)');
      return;
    }

    console.log('Registered routes:');
    for (const route of routes) {
      console.log(`  ${route.method.padEnd(6)} ${route.path}`);
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

    const { mountPath, name, handler } = middlewareStack[index];

    if (mountPath && !req.path.startsWith(mountPath)) {
      runMiddleware(index + 1, req, res);
      return;
    }

    req._middlewareChain = req._middlewareChain || [];
    req._middlewareChain.push(name || mountPath || 'anonymous');

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

  function group(prefix, callback) {
    const groupRouter = createRouter();
    callback(createGroupApp(groupRouter));
    router.mount(prefix, groupRouter);
  }

  function listen(port, callback) {
    router.get('/__routes', (req, res) => {
      res.json({ routes: getRouteManifest() });
    });

    printRouteTable();

    const server = createNetServer(handle);
    server.listen(port, callback);
  }

  return {
    use,
    group,
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
    getRouteManifest,
    handle,
    listen,
  };
}

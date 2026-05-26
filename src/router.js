const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

// Turn /users/:id into a regex and track param names for req.params
function compilePath(pathPattern) {
  const paramNames = [];

  const regexPattern = pathPattern.replace(/:([^/]+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  });

  return {
    regex: new RegExp(`^${regexPattern}$`),
    paramNames,
  };
}

export function createRouter() {
  const routes = Object.fromEntries(HTTP_METHODS.map((method) => [method, []]));

  function addRoute(method, path, handler) {
    const { regex, paramNames } = compilePath(path);
    routes[method].push({ path, regex, paramNames, handler });
  }

  function matchRoute(method, path) {
    const methodRoutes = routes[method] || [];

    for (const route of methodRoutes) {
      const result = path.match(route.regex);
      if (!result) {
        continue;
      }

      const params = {};
      route.paramNames.forEach((name, index) => {
        params[name] = result[index + 1];
      });

      return { handler: route.handler, params };
    }

    return null;
  }

  function listRoutes() {
    const manifest = [];

    for (const method of HTTP_METHODS) {
      for (const route of routes[method]) {
        manifest.push({ method, path: route.path });
      }
    }

    return manifest;
  }

  return {
    get(path, handler) {
      addRoute('GET', path, handler);
    },

    post(path, handler) {
      addRoute('POST', path, handler);
    },

    put(path, handler) {
      addRoute('PUT', path, handler);
    },

    delete(path, handler) {
      addRoute('DELETE', path, handler);
    },

    patch(path, handler) {
      addRoute('PATCH', path, handler);
    },

    match(method, path) {
      return matchRoute(method, path);
    },

    listRoutes() {
      return listRoutes();
    },

    // Prefix all routes from a sub-router (for app.group in step 11)
    mount(prefix, subRouter) {
      for (const method of HTTP_METHODS) {
        for (const route of subRouter._routes[method]) {
          addRoute(method, `${prefix}${route.path}`, route.handler);
        }
      }
    },

    _routes: routes,
  };
}

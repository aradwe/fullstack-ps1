// ?page=1&sort=name → { page: '1', sort: 'name' }
function parseQueryString(queryString) {
  const query = {};
  if (!queryString) {
    return query;
  }

  for (const param of queryString.split('&')) {
    if (!param) {
      continue;
    }
    const [key, value = ''] = param.split('=');
    query[decodeURIComponent(key)] = decodeURIComponent(value);
  }

  return query;
}

// Parses everything before the blank line: request line + headers.
function parseHeaderSection(headerSection) {
  const lines = headerSection.split('\r\n');
  const [method, fullPath, httpVersion] = lines[0].split(' ');

  const questionIndex = fullPath.indexOf('?');
  let path = fullPath;
  let query = {};

  if (questionIndex !== -1) {
    path = fullPath.slice(0, questionIndex);
    query = parseQueryString(fullPath.slice(questionIndex + 1));
  }

  const headers = {};
  for (let i = 1; i < lines.length; i++) {
    const colonIndex = lines[i].indexOf(':');
    if (colonIndex > 0) {
      // Lowercase so handlers can read headers['content-type'] reliably
      const key = lines[i].slice(0, colonIndex).toLowerCase().trim();
      const value = lines[i].slice(colonIndex + 1).trim();
      headers[key] = value;
    }
  }

  return { method, path, query, headers, httpVersion };
}

// Incrementally parses one HTTP/1.1 request from a TCP stream.
// TCP may deliver a request across multiple 'data' events, so we buffer.
export function createRequestParser() {
  let buffer = Buffer.alloc(0);
  let request = null;

  function tryParse() {
    if (request) {
      return;
    }

    // Headers end at the first blank line (\r\n\r\n)
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      return;
    }

    const headerSection = buffer.subarray(0, headerEnd).toString('utf8');
    const { method, path, query, headers, httpVersion } = parseHeaderSection(headerSection);

    const contentLength = Number.parseInt(headers['content-length'] || '0', 10);
    const bodyStart = headerEnd + 4; // skip past \r\n\r\n
    const totalLength = bodyStart + contentLength;

    // POST body might not have arrived yet — wait for more feed() calls
    if (buffer.length < totalLength) {
      return;
    }

    // Slice by byte count, not string length (Content-Length is in bytes)
    const rawBody = buffer.subarray(bodyStart, totalLength).toString('utf8');

    request = {
      method,
      path,
      query,
      params: {}, // filled in later by the router when a :param route matches
      headers,
      rawBody, // parsed JSON/object goes in req.body via middleware (step 9)
      httpVersion,
    };
  }

  return {
    feed(chunk) {
      buffer = Buffer.concat([buffer, chunk]);
      tryParse();
    },

    isComplete() {
      return request !== null;
    },

    getRequest() {
      return request;
    },
  };
}

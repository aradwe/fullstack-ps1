import { getStatusText } from './statusCodes.js';
import fs from 'fs';
import { getMimeType } from './mime.js';

// Builds an Express-style res object for a single TCP connection.
// One request per connection for now (Connection: close).
export function createResponse(socket) {
  let statusCode = 200;
  let statusText = 'OK';
  const headers = {};
  let sent = false;
  let timingStart = null;
  const finishCallbacks = [];

  function invokeFinish() {
    for (const fn of finishCallbacks) {
      fn(statusCode);
    }
  }

  function applyTimingHeader(responseHeaders) {
    if (timingStart !== null) {
      responseHeaders['X-Response-Time'] = `${Date.now() - timingStart}ms`;
    }
  }

  // Serializes headers + body into HTTP/1.1 and closes the socket.
  function buildAndSend(body) {
    if (sent) {
      return;
    }
    sent = true;

    const responseHeaders = { ...headers, Connection: 'close' };
    applyTimingHeader(responseHeaders);

    // Byte length, not string length — matters for non-ASCII bodies
    if (body !== undefined && body !== null && body !== '') {
      responseHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    // Status line + headers (CRLF is required by HTTP/1.1)
    let response = `HTTP/1.1 ${statusCode} ${statusText}\r\n`;
    for (const [key, value] of Object.entries(responseHeaders)) {
      response += `${key}: ${value}\r\n`;
    }
    response += '\r\n';

    if (body !== undefined && body !== null && body !== '') {
      response += body;
    }

    socket.end(response);
    invokeFinish();
  }

  return {
    status(code) {
      statusCode = code;
      statusText = getStatusText(code);
      return this;
    },

    set(key, value) {
      headers[key] = value;
      return this;
    },

    setTimingStart(start) {
      timingStart = start;
      return this;
    },

    onFinish(callback) {
      finishCallbacks.push(callback);
      return this;
    },

    send(text) {
      headers['Content-Type'] = 'text/plain; charset=utf-8';
      buildAndSend(String(text));
    },

    json(data) {
      headers['Content-Type'] = 'application/json';
      buildAndSend(JSON.stringify(data));
    },

    html(content) {
      headers['Content-Type'] = 'text/html; charset=utf-8';
      buildAndSend(String(content));
    },

    redirect(url, code = 302) {
      headers['Location'] = url;
      statusCode = code;
      statusText = getStatusText(code);
      buildAndSend('');
    },

    sendFile(filePath, stats) {
      if (sent) {
        return;
      }
      sent = true;

      const mimeType = getMimeType(filePath);
      const responseHeaders = {
        'Content-Type': mimeType,
        'Content-Length': stats.size,
        Connection: 'close',
      };
      applyTimingHeader(responseHeaders);

      let response = `HTTP/1.1 ${statusCode} ${statusText}\r\n`;
      for (const [key, value] of Object.entries(responseHeaders)) {
        response += `${key}: ${value}\r\n`;
      }
      response += '\r\n';

      socket.write(response);

      const stream = fs.createReadStream(filePath);
      stream.on('end', invokeFinish);
      stream.on('error', invokeFinish);
      stream.pipe(socket);
    },

    end() {
      buildAndSend('');
    },
  };
}

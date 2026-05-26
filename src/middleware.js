const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function colorForStatus(statusCode) {
  if (statusCode >= 500) {
    return COLORS.red;
  }
  if (statusCode >= 400) {
    return COLORS.yellow;
  }
  return COLORS.green;
}

function formatTime(date) {
  return date.toTimeString().slice(0, 8);
}

export function json() {
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('application/json')) {
      next();
      return;
    }

    if (!req.rawBody) {
      req.body = {};
      next();
      return;
    }

    try {
      req.body = JSON.parse(req.rawBody);
      next();
    } catch {
      res.status(400).json({ error: 'Invalid JSON' });
    }
  };
}

export function logger() {
  return (req, res, next) => {
    const start = Date.now();
    res.setTimingStart(start);

    res.onFinish((statusCode) => {
      const ms = Date.now() - start;
      const chain = req._middlewareChain?.length
        ? `${COLORS.dim} [${req._middlewareChain.join(' → ')}]${COLORS.reset}`
        : '';
      const color = colorForStatus(statusCode);
      const time = formatTime(new Date());

      console.log(
        `${COLORS.dim}[${time}]${COLORS.reset} ${COLORS.cyan}${req.method}${COLORS.reset} ${req.path} ${color}→ ${statusCode}${COLORS.reset} ${COLORS.dim}(${ms}ms)${COLORS.reset}${chain}`,
      );
    });

    next();
  };
}

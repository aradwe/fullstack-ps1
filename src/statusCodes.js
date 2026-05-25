const STATUS_TEXT = {
  200: 'OK',
  201: 'Created',
  302: 'Found',
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
};

export function getStatusText(code) {
  return STATUS_TEXT[code] || 'Unknown';
}

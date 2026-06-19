class HttpError extends Error {
  constructor(statusCode, message, code = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = HttpError;

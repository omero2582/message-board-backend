class CustomError extends Error {
  constructor(message, { statusCode }){
    super(message)
    this.statusCode = statusCode;
    // So the error is neat when stringified. NotFoundError: message instead of Error: message
    // this.name = "NotFoundError";
  }
}
export class CustomError extends Error {
  constructor(message, object = {}){
    super(message);
    Object.assign(this, object);
    // this.isOperational = true; Not sure if should add this,
    // basically marks it as a 'known caught error'
    // to differentiate it from an unknown thrown error that
    // is caught in the middleware catch-all error handler
    // https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/operationalvsprogrammererror.md
  }
}

// Not sure if I will use more speciifc errors like below
export class CustomNotFoundError extends CustomError {
  constructor(message, object = {}) {
    super(message, {
      ...object,
      statusCode: 404,
      name: "NotFoundError"
    });
    // this.name = "NotFoundError";
    // // So the error is neat when stringified. NotFoundError: message instead of Error: message
  }
}
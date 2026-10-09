export class CustomError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    public message: string
  ) {
    super(message);
    this.name = "CustomError";
  }
}

export class NotFoundError extends CustomError {
  constructor(message = "Resource not found") {
    super(404, "NF404", message);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized: Sign in to acess all features") {
    super(401, "UA401", message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends CustomError {
  constructor(message = "Validation Failed", public errors?: unknown) {
    super(400, "V400", message);
    this.name = "ValidationError";
  }
}

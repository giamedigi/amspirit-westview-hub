export class JotformConfigurationError extends Error {
  constructor(variableName: string) {
    super(`Missing required server environment variable: ${variableName}`);
    this.name = "JotformConfigurationError";
  }
}

export class JotformRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly responseCode?: number,
  ) {
    super(message);
    this.name = "JotformRequestError";
  }
}

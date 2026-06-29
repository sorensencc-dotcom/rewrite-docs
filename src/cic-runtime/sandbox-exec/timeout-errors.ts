export class HardTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HardTimeoutError';
  }
}

export class SloViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SloViolationError';
  }
}

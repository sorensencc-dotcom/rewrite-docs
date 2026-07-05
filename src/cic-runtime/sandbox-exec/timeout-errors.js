export class HardTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'HardTimeoutError';
    }
}
export class SloViolationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SloViolationError';
    }
}
//# sourceMappingURL=timeout-errors.js.map
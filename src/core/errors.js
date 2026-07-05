export class MAALError extends Error {
    constructor(message) {
        super(message);
        this.name = "MAALError";
    }
}
export class ConfigurationError extends MAALError {
    constructor(message) {
        super(message);
        this.name = "ConfigurationError";
    }
}
export class ProviderError extends MAALError {
    constructor(message) {
        super(message);
        this.name = "ProviderError";
    }
}
export class RoutingError extends MAALError {
    constructor(message) {
        super(message);
        this.name = "RoutingError";
    }
}
//# sourceMappingURL=errors.js.map
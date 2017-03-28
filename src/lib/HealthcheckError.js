export default class HealthcheckError extends Error {
    static TIMEOUT = "timeout";
    static CONNECTION_FAILURE = "connection failure";

    constructor(type, target, code, message, err) {
        super(message);
        this.type = type;
        this.target = target;
        this.code = code;
        this.error = err;
    }
}
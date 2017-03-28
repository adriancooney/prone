export default class HealthcheckError extends Error {
    static TIMEOUT = "timeout";
    static CONNECTION_FAILURE = "connection failure";

    constructor(type, input, code, message, err) {
        super(message);
        this.type = type;
        this.input = input;
        this.code = code;
        this.error = err;
    }
}
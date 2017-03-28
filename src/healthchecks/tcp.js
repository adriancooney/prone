import net from "net";
import url from "url";
import Promise from "bluebird";
import HealthcheckError from "../lib/HealthcheckError";

export default function tcp(input) {
    if(!input) {
        throw new Error("No target for TCP to connect to. Unable to complete healthcheck.");
    }

    if(typeof input === "string") {
        input = url.parse(input);

        // Fix for API inconsistency between url and net
        input.host = input.hostname;
    }

    const { timeout, ...options } = input;
    const sock = net.connect(options);
    sock.setTimeout(timeout || 5000);

    return new Promise((resolve, reject) => {
        sock.on("timeout", () => reject(new HealthcheckError("tcp", input, "Socket connection timeout", HealthcheckError.TIMEOUT)));
        sock.on("error", err => reject(new HealthcheckError("tcp", input, "Socket error", HealthcheckError.CONNECTION_ERROR, err)));
        sock.on("connect", resolve);
    }).finally(() => {
        sock.end();
    });
}
import net from "net";
import url from "url";
import Promise from "bluebird";
import HealthcheckError from "../lib/HealthcheckError";

export default function tcp(target, options) {
    if(!target) {
        throw new Error("No target for TCP to connect to. Unable to complete healthcheck.");
    }

    const targetParsed = url.parse(`tcp://${target}`);

    // Fix for API inconsistency between url and net
    targetParsed.host = targetParsed.hostname;

    const sock = net.connect(targetParsed);
    sock.setTimeout(options.timeout || 5000);

    return new Promise((resolve, reject) => {
        sock.on("timeout", () => reject(new HealthcheckError("tcp", target, HealthcheckError.TIMEOUT, "Socket connection timeout")));
        sock.on("error", err => reject(new HealthcheckError("tcp", target, HealthcheckError.CONNECTION_ERROR, "Socket error", err)));
        sock.on("connect", resolve);
    }).finally(() => {
        sock.end();
    });
}
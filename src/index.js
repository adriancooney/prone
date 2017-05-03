import util from "util";
import Promise from "bluebird";
import HealthcheckError from "./lib/HealthcheckError";
import * as healthchecks from "./healthchecks";
import omit from "lodash.omit";

export const DEFAULT_TIMEOUT = 30000;
export const DEFAULT_DELAY = 1000;

export default async function check(target, options) {
    let healthcheck = getTargetHealthcheck(target);

    if(typeof target === "object") {
        target = target.target;
        healthcheck = getTargetHealthcheck(target);
        options = omit(target, "target");
    }

    if(!target.includes(":")) {
        // Not a protocol, just the name of the healthcheck
        target = undefined;
    }

    if(!healthcheck) {
        throw new Error(`Unknown healthcheck: ${util.inspect(target)}`);
    }

    if(!options.timeout && !options.maxAttempts) {
        options = Object.assign(options, {
            timeout: DEFAULT_TIMEOUT
        });
    }

    options = Object.assign({
        delay: DEFAULT_DELAY
    }, options);

    const startTime = new Date();
    let attempts = [];
    let timedOut = false;

    while(true) { // eslint-disable-line no-constant-condition
        const elapsedTime = new Date() - startTime;

        try {
            if(options.timeout && (elapsedTime + (attempts.length ? options.delay : 0)) > options.timeout) {
                throw new Promise.TimeoutError();
            }

            if(attempts.length > 0) {
                await Promise.delay(options.delay || DEFAULT_DELAY);
            }

            if(options.debug) {
                console.log(`starting healthcheck: ${healthcheck.name}${target ? `(${target})` : ""}`);
            }

            let attempt = Promise.try(healthcheck.bind(null, target, options));

            if(options.timeout) {
                attempt = attempt.timeout(options.timeout - elapsedTime);
            }

            await attempt;

            break;
        } catch(err) {
            if(err instanceof Promise.TimeoutError) {
                if(options.debug) {
                    console.log("healthchecks timed out");
                }

                timedOut = true;
            } else if(err instanceof HealthcheckError) {
                if(options.debug) {
                    console.log(`healthcheck failed: ${err.message}`);
                }

                attempts.push(err);
            } else {
                throw err;
            }
        }

        if(options.maxAttempts && attempts.length >= options.maxAttempts) {
            throw Object.assign(new Error(`Max attempts (${options.maxAttempts}) reached.`), { attempts });
        }

        if(timedOut || options.timeout && elapsedTime >= options.timeout) {
            throw Object.assign(new Error("Healthcheck timed out."), { attempts });
        }
    }

    return {
        time: new Date() - startTime,
        attempts
    };
}

function getTargetHealthcheck(target) {
    if(typeof target === "string" && !target.includes(":") && healthchecks[target]) {
        return healthchecks[target];
    } else if(typeof target === "string" && target.includes(":")) {
        const [ protocol ] = target.split(":");

        if(protocol && healthchecks[protocol]) {
            return healthchecks[protocol];
        }
    }
}
import util from "util";
import Promise from "bluebird";
import HealthcheckError from "./lib/HealthcheckError";
import * as healthchecks from "./healthchecks";
import omit from "lodash.omit";

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DELAY = 1000;

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

    const startTime = new Date();
    let attempts = [];
    let timedOut = false;

    while(true) { // eslint-disable-line no-constant-condition
        const elapsedTime = new Date() - startTime;

        try {
            if(attempts.length > 0) {
                await Promise.delay(options.delay || DEFAULT_DELAY);
            }

            if(options.debug) {
                console.log(`starting healthcheck: ${healthcheck.name}${target ? `(${target})` : ""}`);
            }

            await (
                Promise.try(healthcheck.bind(null, target, options))
                    .timeout(options.timeout ? options.timeout - elapsedTime : null)
            )

            break;
        } catch(err) {
            if(err instanceof Promise.TimeoutError) {
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
            throw Object.assign(new Error(`Max attempts (${maxAttempts}) reached.`), { attempts });
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
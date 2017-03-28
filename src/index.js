import util from "util";
import Promise from "bluebird";
import HealthcheckError from "./lib/HealthcheckError";
import * as healthchecks from "./healthchecks";

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DELAY = 1000;

export default async function check(input) {
    let healthcheck, options, timeout, maxAttempts, delay;

    if(typeof input === "string" && !input.includes(":") && healthchecks[input]) {
        healthcheck = healthchecks[input];
    } else if(typeof input === "string" && input.includes(":")) {
        const [ protocol ] = input.split(":");

        if(protocol && healthchecks[protocol]) {
            healthcheck = healthchecks[protocol];
            options = input;
        }
    } else if(typeof input === "object") {
        let { healthcheck, options, timeout, maxAttempts, delay } = input;
    }

    if(!healthcheck) {
        throw new Error(`Unknown healthcheck: ${util.inspect(input)}`);
    }

    if(!timeout && !maxAttempts) {
        timeout = DEFAULT_TIMEOUT;
    }

    const startTime = new Date();
    let attempts = [];
    let timedOut = false;

    while(true) {
        const elapsedTime = new Date() - startTime;

        try {
            if(attempts.length > 0) {
                await Promise.delay(delay || DEFAULT_DELAY);
            }

            // There's a reason why this is all on one line: getting weird unhandled rejection errors
            // in console if we don't keep it on a single line.
            await Promise.try(healthcheck.bind(null, options)).timeout(timeout ? timeout - elapsedTime : null);

            break;
        } catch(err) {
            if(err instanceof Promise.TimeoutError) {
                timedOut = true;
            } else if(err instanceof HealthcheckError) {
                attempts.push(err);
            } else {
                throw err;
            }
        }

        if(maxAttempts && attempts.length >= maxAttempts) {
            throw Object.assign(new Error(`Max attempts (${maxAttempts}) reached.`), { attempts });
        }

        if(timedOut || timeout && elapsedTime >= timeout) {
            throw Object.assign(new Error(`Healthcheck timed out.`), { attempts });
        }
    }

    return {
        time: new Date() - startTime,
        attempts
    };
}
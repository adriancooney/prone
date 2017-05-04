import util from "util";
import winston from "winston";
import Promise from "bluebird";
import HealthcheckError from "./lib/HealthcheckError";
import * as healthchecks from "./healthchecks";
import omit from "lodash.omit";

export const DEFAULT_TIMEOUT = 30000;
export const DEFAULT_DELAY = 1000;

/**
 * Execute a healthcheck given a target.
 *
 * Targets:
 *
 *   A target is a single token or a DSN. A token is just then name of the
 *   healthcheck to use and the default connection details are assumed.
 *   Alternatively, a target may also be styled like a protocol (`<target>://`)
 *   and anything after that is passed to the healthcheck.
 *
 * @param  {String} target  The DSN or target url.
 * @param  {Object} options Healthcheck config.
 * @return {Promise}        Resolves when the healthcheck completes.
 */
export default async function check(target, options, logger = winston) {
    if(typeof target === "object") {
        target = target.target;
        options = omit(target, "target");
    }

    if(typeof target !== "string") {
        throw new Error("Target must be a string.");
    }

    const [ type, dsn ] = target.split("://");
    const healthcheck = healthchecks[type];

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

            logger.debug(`starting healthcheck: ${target}`);

            let attempt = Promise.try(healthcheck.bind(null, dsn, options, logger));

            if(options.timeout) {
                attempt = attempt.timeout(options.timeout - elapsedTime);
            }

            await attempt;

            break;
        } catch(err) {
            if(err instanceof Promise.TimeoutError) {
                logger.debug("healthchecks timed out");
                timedOut = true;
            } else if(err instanceof HealthcheckError) {
                logger.debug(`healthcheck failed: ${err.message}`);
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
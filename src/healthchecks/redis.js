import Promise from "bluebird";
import HealthcheckError from "../lib/HealthcheckError";

const DEPENDENCY = "redis";

export default function redis(target) {
    return Promise.try(() => System.import(DEPENDENCY)).then(redis => {
        const client = redis.createClient(target);

        return new Promise((resolve, reject) => {
            client.on("connect", resolve);
            client.on("error", reject);
        }).finally(() => {
            client.end(false);
        });
    }).catch(err => {
        if(err.code === "ECONNREFUSED") {
            throw new HealthcheckError("redis", target, HealthcheckError.CONNECTION_FAILURE, "Unable to connect to Redis server", err);
        }

        throw err;
    });
}
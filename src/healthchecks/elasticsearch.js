import Promise from "bluebird";
import HealthcheckError from "../lib/HealthcheckError";

export const DEPENDENCY = "elasticsearch";

export default function elasticsearch(target, options, logger) {
    return Promise.try(() => System.import(DEPENDENCY)).then(elasticsearch => {
        const client = new elasticsearch.Client({
            host: target,
            log : [{
                type: "stdio",
                levels: []
            }]
        });

        return Promise.try(client.ping.bind(client)).finally(() => {
            client.close();
        });
    }).catch(error => {
        if(error.message === "No Living connections") {
            throw new HealthcheckError("elasticsearch", target, HealthcheckError.CONNECTION_FAILURE, "No Living connections", error);
        }

        throw error;
    });
}
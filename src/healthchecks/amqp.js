import Promise from "bluebird";
import HealthcheckError from "../lib/HealthcheckError";

const DEPENDENCY = "amqplib";

export default function amqp(target) {
    return Promise.try(() => System.import(DEPENDENCY)).then(amqplib => {
        return amqplib.connect(target);
    }).catch(err => {
        if(err.code === "ECONNREFUSED") {
            throw new HealthcheckError("amqp", target, HealthcheckError.CONNECTION_FAILURE, "Unable to connect to AMQP broker", err);
        }

        if(err.code === "ECONNRESET" || err.message.match(/Socket closed abruptly during opening handshake/)) {
            throw new HealthcheckError("amqp", target, HealthcheckError.CONNECTION_FAILURE, "Failed handshake", err);
        }

        throw err;
    }).then(connection => {
        return connection.close();
    });
}
import Promise from "bluebird";
import HealthcheckError from "../lib/HealthcheckError";

export const DEPENDENCY = "mysql";

export default function mysql(target) {
    return Promise.try(() => System.import(DEPENDENCY)).then(mysql => {
        const connection = mysql.createConnection(`mysql://${target}`);

        connection.query = Promise.promisify(connection.query, { context: connection });

        return connection.query("SELECT 1").finally(() => {
            connection.end();
        });
    }).catch(err => {
        switch (err.code) {
        case "PROTOCOL_CONNECTION_LOST":
            throw new HealthcheckError("mysql", target, HealthcheckError.CONNECTION_FAILURE, "Connection lost to MySQL server", err);
        case "ECONNREFUSED":
            throw new HealthcheckError("mysql", target, HealthcheckError.CONNECTION_FAILURE, "Unable to connect to MySQL server", err);
        default:
            throw err;
        }
    });
}

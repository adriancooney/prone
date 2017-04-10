import Promise from "bluebird";
import HealthcheckError from "../lib/HealthcheckError";

const MYSQL_DEPENDENCY = "mysql";

export default function mysql(target) {
    return Promise.try(() => System.import(MYSQL_DEPENDENCY)).then(mysql => {
        const connection = mysql.createConnection(target);

        connection.query = Promise.promisify(connection.query, { context: connection });

        return connection.query("SELECT 1").finally(() => {
            connection.end();
        });
    }).catch(err => {
        switch (err.code) {
        case "PROTOCOL_CONNECTION_LOST":
            throw new HealthcheckError("mysql", target, HealthcheckError.CONNECTION_FAILUE, "Connection lost to MySQL server", err);
        case "ECONNREFUSED":
            throw new HealthcheckError("mysql", target, HealthcheckError.CONNECTION_FAILUE, "Unable to connect to MySQL server", err);
        default:
            throw err;
        }
    });
}

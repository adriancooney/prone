# Prone
Wait for services to come available then exit with code 0. This tool is similar to the `wait-for-it.sh` and `dockerize wait` tools except entirely built in Node. This allows us to define a `healthy` script in our package.json to postpone the startup of our system until our services are ready for connection.

Example:

```sh
$ prone tcp://redis:6379 tcp://localhost:8080 \
    && echo "Services up" \
    || echo "Timed out"
```

Example in our package.json:

```js
{
    ...,
    "scripts": {
        "healthy": "prone tcp://redis:6379 tcp://mysql:3307",
        "start": "node src/index.js",
        "up": "npm run healthy && npm start"
    },
    ...
}
```

## CLI
```sh

  Usage: prone <target ...>

  Options:

    -h, --help                     output usage information
    -V, --version                  output the version number
    -t, --timeout <timeout>        timeout after ms (default: 30000ms)
    -m, --max-attempts <attempts>  maximum amount of attempts before failing
    --delay <delay>                the delay between healthchecks (default: 1000ms)
    -d, --debug                    output debug logs

  Examples:

    $ prone tcp://google.com:80 -- echo "Google is up!"
    $ prone redis rabbitmq && echo 'Hosts are up'

```

Available targets:

| Name | Healtcheck | npm Dependency | Format | Default | Example |
|---|---|---|---|---|---|
| `tcp` | Considers service healthy if a TCP connection is made to the target | *none* | `tcp://host:port` | *none* | `tcp://google.com:80` |
| `amqp` | Use `amqplib.connect` to establish a connection to an AMQP broker | `amqplib` | [`amqp://username:password@host:port/vhost?query`](http://www.rabbitmq.com/uri-spec.html) | *none* | `amqp://rabbitmq:5672` |
| `rabbitmq` | Extends `amqp` to connection to RabbitMQ | `amqplib` | `rabbitmq[://username:password@host:port]` | `rabbitmq://localhost:5672` | `rabbitmq` |
| `redis` | Connects to a Redis service with `redis.createClient` | `redis` | `redis[://username:password@host:port/vhost?query]` | `redis://localhost:6389` | |`redis` |
| `mysql` | Connects to a MySQL service with `mysql.createConnection` | `mysql` | `mysql://username:password@host:port/database` | *none* | `mysql://root:root@localhost:3306/mysql` |`mysql` |
| `elasticsearch` | Connects to Elasticsearch | `elasticsearch` | `elasticsearch://host:port` | `elasticsearch://localhost:9200` | `elasticsearch` |

*Note: The npm Dependency with `npm install` is required to be installed for the healthcheck to work.*

## API
#### `check( input: string|object )`
Check if a service is healthy. If it is, resolve the promise otherwise reject with timeout error or max attempts reached.
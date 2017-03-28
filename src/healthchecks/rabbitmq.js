import amqp from "./amqp";

const DEFAULT_TARGET = "rabbitmq://localhost:5672";

export default function rabbitmq(target = DEFAULT_TARGET) {
    return amqp(target.replace(/^rabbitmq:/, "amqp:"));
}
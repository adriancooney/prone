import amqp, { DEPENDENCY as AMQP_DEPENDENCY } from "./amqp";

export const DEPENDENCY = AMQP_DEPENDENCY;
export const DEFAULT_TARGET = "rabbitmq://localhost:5672";

export default function rabbitmq(target = DEFAULT_TARGET) {
    return amqp(target.replace(/^rabbitmq:/, "amqp:"));
}
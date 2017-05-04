import amqp, { DEPENDENCY as AMQP_DEPENDENCY } from "./amqp";

export const DEPENDENCY = AMQP_DEPENDENCY;
export const DEFAULT_TARGET = "localhost:5672";

export default function rabbitmq(target = DEFAULT_TARGET, options, logger) {
    return amqp(target);
}
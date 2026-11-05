import pino from "pino";

export const logger = pino({
    base: {service: 'worker'},
    timestamp: pino.stdTimeFunctions.isoTime,
});
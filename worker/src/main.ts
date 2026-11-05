import './tracing';
import Redis from "ioredis";
import { config } from "./config";
import { MongoClient } from "mongodb";
import { atrasoEvento, duracao, eventosProcessados, startMetricsServer } from "./metrics";
import amqp from "amqplib";
import { logger } from "./logger";
import { EventoCorrida, processarEvento } from "./processor";

async function main() {
    const redis = new Redis(config.redisUrl);
    const mongo = new MongoClient(config.mongoUrl);
    await mongo.connect();
    const eventos = mongo.db().collection('eventos');
    await eventos.createIndex({eventId: 1}, {unique: true});

    startMetricsServer(config.metricsPort);

    const connection = await amqp.connect(config.rabbitUrl);
    const channel = await connection.createChannel();

    // topologia identica a API (argumentos diferentes podem causar erro PRECONDITION_FAILED)
    await channel.assertExchange('corridas.dlx', 'fanout', {durable: true});
    await channel.assertQueue('corridas.worker.dlq', {durable: true});
    await channel.bindQueue('corridas.worker.dlq', 'corridas.dlx', '');
    
    await channel.assertExchange('corridas.events', 'topic', {durable: true});
    await channel.assertQueue('corridas.worker', {durable: true, arguments: {'x-dead-letter-exchange': 'corridas.dlx'}});
    await channel.bindQueue('corridas.worker', 'corridas.events', 'corridas.*');

    await channel.prefetch(10);  // No maximo 10 mensagens por vez sem confirmação

    await channel.consume('corridas.worker', async (msg) => {
        if(!msg) return;

        const correlationId = msg.properties.correlationId as string | undefined;
        const tipo = msg.fields.routingKey;

        const log = logger.child({correlation_id: correlationId, message_id: msg.properties.messageId});
        const fim = duracao.startTimer();

        try {
           const evt: EventoCorrida = JSON.parse(msg.content.toString());
           atrasoEvento.observe(Date.now() - new Date(evt.ocorridoEm).getTime() / 1000);

           const r = await processarEvento(evt, correlationId, {redis, eventos});

           if(r.duplicado) {
            log.info({eventId: evt.eventId}, 'Evento duplicado ignorado');
           } else {
            log.info({eventId: evt.eventId, tipo, cacheAtualizado: r.cacheAtualizado}, 'Evento processado com sucesso');
            eventosProcessados.inc({tipo, resultado: r.duplicado ? 'duplicado' : 'ok'});
            channel.ack(msg);  // Só confirma depois de processar com sucesso
           }           
        } catch (error) {
            log.error({error}, 'Falha ao processar; enviando para a DLQ');
            eventosProcessados.inc({tipo, resultado: 'erro'});
            channel.nack(msg, false, false);  // Não confirma e não repõe na fila
        } finally {
            fim();
        };

        log.info('Worker aguardando novas mensagens...');

        for (const sig of ['SIGINT', 'SIGTERM'] as const) {
            process.on(sig, async () => {
                log.info({sig}, 'Worker recebendo sinal de encerramento...');
                await channel.close();
                await connection.close();
                await mongo.close();
                redis.disconnect()
                process.exit(0);
            });
        };
    });
}

main().catch((error) => {
    logger.error({error}, 'Falha ao iniciar o worker');
    process.exit(1);
});
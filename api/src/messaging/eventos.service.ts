import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';
import { randomUUID } from 'node:crypto';
import { getCorrelationId } from '../common/correlations';
import { Logger } from '@nestjs/common';

type Connection = Awaited<ReturnType<typeof amqp.connect>>;

@Injectable()
export class EventosService implements OnModuleInit, OnModuleDestroy {
  private connection!: Connection;
  private channel!: amqp.ConfirmChannel;
  private logger: Logger;

  constructor(private config: ConfigService) {
    this.logger = new Logger(EventosService.name);
  }

  async onModuleInit() {
    this.connection = await amqp.connect(
      this.config.getOrThrow<string>('RABBITMQ_URL'),
    );
    this.channel = await this.connection.createConfirmChannel();

    await this.channel.assertExchange('corridas.dlx', 'fanout', {
      durable: true,
    });
    await this.channel.assertQueue('corridas.worker.dlq', { durable: true });
    await this.channel.bindQueue('corridas.worker.dlq', 'corridas.dlx', '');

    await this.channel.assertExchange('corridas.events', 'topic', {
      durable: true,
    });
    await this.channel.assertQueue('corridas.worker', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'corridas.dlx',
      },
    });
    await this.channel.bindQueue(
      'corridas.worker',
      'corridas.events',
      'corrida.*',
    );

    this.logger.log('RabbitMQ conectado e topologia declarada');
  }

  async publicar(
    tipo: 'corrida.criada' | 'corrida.status_alterado',
    corrida: unknown,
  ) {
    const eventId = randomUUID();
    const correlationId = getCorrelationId() ?? eventId;

    const body = Buffer.from(
      JSON.stringify({
        eventId,
        tipo,
        ocorridoEm: new Date().toISOString(),
        corrida,
      }),
    );

    await new Promise<void>((resolve, reject) => {
      this.channel.publish(
        'corridas.events',
        tipo,
        body,
        {
          persistent: true, // a mensagem sobrevive ao reinicio do broker
          messageId: eventId,
          correlationId,
          contentType: 'application/json',
          headers: {
            'x-correlation-id': correlationId,
          },
        },
        (err) => {
          if (!err) {
            resolve();
            return;
          }
          reject(err instanceof Error ? err : new Error(String(err)));
        },
      );
    });
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}

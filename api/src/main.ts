import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { correlationMiddleware } from './common/correlations';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { metricsMiddleware } from './metrics/metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {bufferLogs: true});
  app.useLogger(app.get(Logger));
  app.use(correlationMiddleware);
  app.use(metricsMiddleware);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors();
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

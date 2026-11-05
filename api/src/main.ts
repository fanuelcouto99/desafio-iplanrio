import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { correlationMiddleware } from './common/correlations';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(correlationMiddleware);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.enableCors();
  app.enableShutdownHooks()
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

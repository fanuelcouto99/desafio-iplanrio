import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CorridasModule } from './corridas/corridas.module';
import { HealthController } from './health/health.controller';
import { RedisModule } from './cache/redis.module';
import { LoggerModule } from 'nestjs-pino';
import { getCorrelationId } from './common/correlations';
import { MetricsController } from './metrics/metrics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    CorridasModule,
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: () => ({
          correlation_id: getCorrelationId()
        })
      }
    }),
  ],
  controllers: [HealthController, MetricsController],
  providers: [],
})
export class AppModule {}

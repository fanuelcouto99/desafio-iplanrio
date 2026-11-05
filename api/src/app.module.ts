import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CorridasModule } from './corridas/corridas.module';
import { HealthController } from './health/health.controller';
import { RedisModule } from './cache/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    CorridasModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

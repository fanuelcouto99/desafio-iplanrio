import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../cache/redis.service";

@Controller('health')
export class HealthController {
    constructor (
        private prisma: PrismaService, 
        private redis: RedisService
    ) {}

   @Get('live')
   live() {
    return { status: 'ok' };
   }

   @Get('ready')
   async ready() {
    try {
        await this.prisma.$queryRaw`SELECT 1`;
        await this.redis.ping();
        return { status: 'ok' };
    } catch (error) {
        throw new ServiceUnavailableException('Dependencia indisponível');
    };
   };
};
import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from 'express';
import { registry } from "./metrics";

@Controller('metrics')
export class MetricsController {
    @Get()
    async getMetrics(@Res() res: Response) {
        res.set('Content-Type', registry.contentType);
        res.send(await registry.metrics());
    }
}
import type { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

client.collectDefaultMetrics();

const labels = ['method', 'route', 'status'];

const httpTotal = new client.Counter({
    name: 'http_requests_total', 
    help: 'Requisições HTTPs',
    labelNames: labels,
});

const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Latência das requisições HTTPs',
    labelNames: labels,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.path == '/metrics' || req.path.startsWith('/health')) {
        return next();
    }

    const end = httpDuration.startTimer();
    res.on('finish', () => {
        const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : 'desconhecida';

        const l = { method: req.method, route, status: String(res.statusCode) };
        httpTotal.inc(l);
        end(l);
    });

    next();
};

export const registry = client.register;
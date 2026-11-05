import http from 'node:http';
import client from 'prom-client';

client.collectDefaultMetrics();

export const eventosProcessados = new client.Counter({
    name: 'worker_events_processed_total',
    help: 'Eventos consumidos, por tipo e resultado',
    labelNames: ['tipo', 'resultado'],
});

export const duracao = new client.Histogram({
    name: 'worker_event_duration_seconds',
    help: 'Tempo para processar um evento',
    buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2]
});

export const atrasoEvento = new client.Histogram({
    name: 'worker_event_lag_secondas',
    help: 'Atraso do evento em segundos',
    buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

export function startMetricsServer(port: number) {
    http.createServer(async (req, res) => {
        if(req.url === '/metrics') {
            res.setHeader('Content-Type', client.register.contentType);
            res.end(await client.register.metrics());
        } else if(req.url === '/health/live') {
            res.end('ok');
        } else {
            res.statusCode = 404;
            res.end()
        };
    }).listen(port);
};
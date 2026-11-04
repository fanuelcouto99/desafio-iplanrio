import { AsyncLocalStorage } from 'node:async_hooks';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

// Async Local Storage para armazenar o correlation id em cada requisição
const als = new AsyncLocalStorage<{ correlationId: string }>();

// Função para obter o correlation id da requisição atual
export const getCorrelationId = (): string | undefined => {
    return als.getStore()?.correlationId;
};

// Middleware para adicionar o correlation id à requisição e resposta
export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
    const id = (req.headers['x-correlation-id'] as string) || randomUUID();
    res.setHeader('x-correlation-id', id);
    als.run({ correlationId: id }, next);
};
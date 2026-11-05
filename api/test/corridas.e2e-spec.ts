import { correlationMiddleware } from '../src/common/correlations';
import { PrismaService } from '../src/prisma/prisma.service';
import { token } from './helpers';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';

describe('corridas (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    const passageiro = token('passageiro-1', 'passageiro');
    const passageiro2 = token('passageiro-2', 'passageiro');
    const motorista = token('motorista-1', 'motorista');
    const body = { origem: 'Centro', destino: 'Jardim Botânico' };

    beforeAll(async () => {
        const mod = await Test.createTestingModule({imports: [AppModule]}).compile();
        app = mod.createNestApplication()
        app.use(correlationMiddleware);
        app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true}));
        await app.init();
        prisma = app.get(PrismaService);
    });

    beforeEach(async () => {
        await prisma.idempotencyKey.deleteMany();
        await prisma.corrida.deleteMany()
    });

    afterAll(async () => {
        await app.close();
    });

    const criar = (key: string, t = passageiro) => {
        return request(app.getHttpServer())
            .post('/corridas')
            .set('Authorization', `Bearer ${t}`)
            .set('Idempotency-Key', key)
            .send(body);
    };

    it('fluxo feliz: cria, motorista aceita, passageiro lê', async () => {
        const criada = await criar('feliz-1').expect(201);
        expect(criada.body.status).toBe('SOLICITADA');

        const aceita = await request(app.getHttpServer())
            .patch(`/corridas/${criada.body.id}/status`)
            .set('Authorization', `Bearer ${motorista}`)
            .send({status: 'ACEITA'})
            .expect(200);
        expect(aceita.body.status).toBe('ACEITA');

        const lida = await request(app.getHttpServer())
            .get(`/corridas/${criada.body.id}`)
            .set('Authorization', `Bearer ${passageiro}`)
            .expect(200);
        expect(lida.body.status).toBe('ACEITA');
    });

    it('falha 1: Idempotency-Key não duplica a corrida', async () => {
        const r1 = await criar('idem-1').expect(201);
        const r2 = await criar('idem-1').expect(200);
        expect(r2.body.id).toBe(r1.body.id);
        expect(await prisma.corrida.count()).toBe(1);
    });

    it('falha 2: Autenticação e Autorização (401 e 403', async () => {
        await request(app.getHttpServer())
            .post('/corridas')
            .send(body)
            .expect(401);

        await request(app.getHttpServer())
            .post('/corridas')
            .set('Authorization', `Bearer invalido`)
            .send(body)
            .expect(401);

        const criada = await criar('authz-1').expect(201);
        await request(app.getHttpServer())
            .patch(`/corridas/${criada.body.id}/status`)
            .set('Authorization', `Bearer ${passageiro}`)
            .send({status: 'ACEITA'})
            .expect(403);

        await request(app.getHttpServer())
            .get(`/corridas/${criada.body.id}`)
            .set('Authorization', `Bearer ${passageiro2}`)
            .expect(403);
    });

    it('falha 3: Transição Invalida (409)', async () => {
        const criada = await criar('trans-1').expect(201);
        await request(app.getHttpServer())
            .patch(`/corridas/${criada.body.id}/status`)
            .set('Authorization', `Bearer ${motorista}`)
            .send({status: 'FINALIZADA'})
            .expect(409);
    });
});
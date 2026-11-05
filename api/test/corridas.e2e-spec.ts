import { correlationMiddleware } from '../src/common/correlations';
import { PrismaService } from '../src/prisma/prisma.service';
import { token } from './helpers';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

interface CorridaBody {
  id: string;
  status: string;
}

function corpo(body: unknown): CorridaBody {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('id' in body) ||
    !('status' in body)
  ) {
    throw new Error('Resposta de corrida inválida');
  }

  const { id, status } = body;
  if (typeof id !== 'string' || typeof status !== 'string') {
    throw new Error('Resposta de corrida inválida');
  }

  return { id, status };
}

describe('corridas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const passageiro = token('passageiro-1', 'passageiro');
  const passageiro2 = token('passageiro-2', 'passageiro');
  const motorista = token('motorista-1', 'motorista');
  const body = { origem: 'Centro', destino: 'Jardim Botânico' };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.use(correlationMiddleware);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.idempotencyKey.deleteMany();
    await prisma.corrida.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const servidor = (): App => app.getHttpServer() as App;

  const criar = (key: string, t = passageiro) => {
    return request(servidor())
      .post('/corridas')
      .set('Authorization', `Bearer ${t}`)
      .set('Idempotency-Key', key)
      .send(body);
  };

  it('fluxo feliz: cria, motorista aceita, passageiro lê', async () => {
    const criada = corpo((await criar('feliz-1').expect(201)).body);
    expect(criada.status).toBe('SOLICITADA');

    const aceita = corpo(
      (
        await request(servidor())
          .patch(`/corridas/${criada.id}/status`)
          .set('Authorization', `Bearer ${motorista}`)
          .send({ status: 'ACEITA' })
          .expect(200)
      ).body,
    );
    expect(aceita.status).toBe('ACEITA');

    const lida = corpo(
      (
        await request(servidor())
          .get(`/corridas/${criada.id}`)
          .set('Authorization', `Bearer ${passageiro}`)
          .expect(200)
      ).body,
    );
    expect(lida.status).toBe('ACEITA');
  });

  it('falha 1: Idempotency-Key não duplica a corrida', async () => {
    const r1 = corpo((await criar('idem-1').expect(201)).body);
    const r2 = corpo((await criar('idem-1').expect(200)).body);
    expect(r2.id).toBe(r1.id);
    expect(await prisma.corrida.count()).toBe(1);
  });

  it('falha 2: Autenticação e Autorização (401 e 403', async () => {
    await request(servidor()).post('/corridas').send(body).expect(401);

    await request(servidor())
      .post('/corridas')
      .set('Authorization', `Bearer invalido`)
      .send(body)
      .expect(401);

    const criada = corpo((await criar('authz-1').expect(201)).body);
    await request(servidor())
      .patch(`/corridas/${criada.id}/status`)
      .set('Authorization', `Bearer ${passageiro}`)
      .send({ status: 'ACEITA' })
      .expect(403);

    await request(servidor())
      .get(`/corridas/${criada.id}`)
      .set('Authorization', `Bearer ${passageiro2}`)
      .expect(403);
  });

  it('falha 3: Transição Invalida (409)', async () => {
    const criada = corpo((await criar('trans-1').expect(201)).body);
    await request(servidor())
      .patch(`/corridas/${criada.id}/status`)
      .set('Authorization', `Bearer ${motorista}`)
      .send({ status: 'FINALIZADA' })
      .expect(409);
  });
});

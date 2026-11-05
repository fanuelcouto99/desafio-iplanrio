import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';
import { EventosService } from '../messaging/eventos.service';
import { AuthUser } from '../auth/auth-user';
import { CriarCorridaDto } from './dto/criar-corrida.dto';
import { createHash } from 'node:crypto';
import { Corrida, Prisma } from '../generated/prisma/client';
import { AlterarStatusDto } from './dto/alterar-status.dto';

const TRANSICOES: Record<string, 'ACEITA' | 'EM_ANDAMENTO' | 'FINALIZADA'> = {
  SOLICITADA: 'ACEITA',
  ACEITA: 'EM_ANDAMENTO',
  EM_ANDAMENTO: 'FINALIZADA',
};

@Injectable()
export class CorridasService {
  private readonly logger = new Logger(CorridasService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventos: EventosService,
  ) {}

  async criar(user: AuthUser, dto: CriarCorridaDto, idemKey: string) {
    const hash = createHash('sha256').update(JSON.stringify(dto)).digest('hex');

    try {
      const corrida = await this.prisma.$transaction(async (tx) => {
        const c = await tx.corrida.create({
          data: {
            passageiroId: user.userId,
            origem: dto.origem,
            destino: dto.destino,
          },
        });

        await tx.idempotencyKey.create({
          data: {
            key: idemKey,
            userId: user.userId,
            requestHash: hash,
            corridaId: c.id,
          },
        });

        return c;
      });

      await this.eventos.publicar('corrida.criada', corrida);
      return { corrida, replay: false };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const prev = await this.prisma.idempotencyKey.findUniqueOrThrow({
          where: {
            userId_key: {
              userId: user.userId,
              key: idemKey,
            },
          },
        });

        if (prev.requestHash !== hash) {
          throw new UnprocessableEntityException(
            'Idempotency-key reutilizada com corpo diferente',
          );
        }

        const corrida = await this.prisma.corrida.findUniqueOrThrow({
          where: {
            id: prev.corridaId,
          },
        });

        return { corrida, replay: true };
      }
      throw error;
    }
  }

  async alterarStatus(id: string, dto: AlterarStatusDto, user: AuthUser) {
    const corridaAtual = await this.prisma.corrida.findUnique({
      where: {
        id,
      },
    });

    if (!corridaAtual) {
      throw new NotFoundException('Corrida não encontrada');
    }

    if (TRANSICOES[corridaAtual.status] !== dto.status) {
      throw new ConflictException(
        `Transição inválida: ${corridaAtual.status} -> ${dto.status}`,
      );
    }

    // Depois de aceita, apenas o motorista que aceitou continua a corrida
    if (corridaAtual.motoristaId && corridaAtual.motoristaId !== user.userId) {
      throw new ForbiddenException();
    }

    try {
      const corrida = await this.prisma.corrida.update({
        where: {
          id,
          version: corridaAtual.version,
        },
        data: {
          status: dto.status,
          motoristaId: user.userId,
          version: {
            increment: 1,
          },
        },
      });

      await this.eventos.publicar('corrida.status_alterado', corrida);
      return corrida;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ConflictException(
          'A corrida foi alterada por outra requisição',
        );
      }

      throw error;
    }
  }

  async buscar(id: string, user: AuthUser) {
    const key = `corrida:${id}`;
    const cached = await this.redis.get(key);

    let corrida: Corrida | null = null;
    if (cached) {
      const parsed: unknown = JSON.parse(cached) as unknown;
      corrida = parsed as Corrida;
    }

    if (!corrida) {
      corrida = await this.prisma.corrida.findUnique({
        where: {
          id,
        },
      });

      if (!corrida) {
        throw new NotFoundException('Corrida não encontrada');
      }

      await this.redis.set(key, JSON.stringify(corrida), 'EX', 3600);
    }

    if (user.role === 'passageiro' && corrida.passageiroId !== user.userId) {
      throw new ForbiddenException();
    }

    return corrida;
  }

  listarDoPassageiro(user: AuthUser) {
    return this.prisma.corrida.findMany({
      where: {
        passageiroId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  // Risco conhecido (dual write): se o publish falhar depois do commit, o evento se perde
  // Solução de produção: outbox.
  private async publicar(
    tipo: 'corrida.criada' | 'corrida.status_alterado',
    corrida: unknown,
  ) {
    try {
      await this.eventos.publicar(tipo, corrida);
    } catch (error: unknown) {
      const motivo = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        { err: motivo, tipo },
        'Falha ao publicar evento: Corrida já gravada',
      );
      throw motivo;
    }
  }
}

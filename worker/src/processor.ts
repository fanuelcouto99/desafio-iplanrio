import Redis from 'ioredis';
import {Collection} from 'mongodb';

//  Só grava no cache se a versão que for recebida for mais recente que a versão armazenada
const LUA_SET_SE_MAIS_RECENTE = `
    local cur = redis.call('GET', KEYS[1])
    if cur then
        local v = cjson.decode(cur).version
        if v and tonumber(v) >= tonumber(ARGV[2]) then return 0 end
    end
    redis.call('SET', KEYS[1], ARGV[1], 'EX', 3600)
    return 1
`;

export interface EventoCorrida {
    eventId: string;
    tipo: string;
    ocorridoEm: string;
    corrida: {
        id: string;
        versao: number;
        [campo: string]: unknown;
    }
}

export async function processarEvento(evt: EventoCorrida, correlationId: string | undefined, deps: {redis: Redis, eventos: Collection}) {
    // Cache primeiro: operação idempotente - Evento antigo ou repetido, não altera nada
    const r = await deps.redis.eval(
        LUA_SET_SE_MAIS_RECENTE, 
        1, 
        `corrida:${evt.corrida.id}`,
        JSON.stringify(evt.corrida),
        String(evt.corrida.versao),
    );
    const cacheAtualizado = r === 1;

    // Historico depois: o indice unico barra a duplicação de eventos
    try {
        await deps.eventos.insertOne({
            eventId: evt.eventId, 
            tipo: evt.tipo,
            corridaId: evt.corrida.id,
            ocorridoEm: new Date(evt.ocorridoEm),
            correlationId,
            recebidoEm: new Date(),
        });

        return {duplicado: false, cacheAtualizado};
    } catch (error) {
        if((error as {code?: string}).code === '11000') {
            return {duplicado: true, cacheAtualizado};
        };
        throw error;
    };
}
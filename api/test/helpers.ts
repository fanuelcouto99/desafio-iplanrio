import { sign } from 'jsonwebtoken';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const privateKey = readFileSync(
  join(__dirname, '..', 'test-keys', 'test-private.pem'),
);

export const token = (sub: string, role: 'passageiro' | 'motorista') => {
  return sign({ sub, role }, privateKey, {
    algorithm: 'RS256',
    issuer: 'corridas-teste',
    expiresIn: '1h',
  });
};

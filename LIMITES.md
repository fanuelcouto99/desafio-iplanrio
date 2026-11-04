# Limites

Documento vivo: atualizo conforme o projeto avança.

## O que não fiz (até agora)
- JWKS: a API valida o JWT com uma chave pública fixa, guardada em base64 na
  variável de ambiente JWT_PUBLIC_KEY_B64. Não há rotação de chaves.

## O que faria com mais tempo
- Migrar para JWKS com rotação de chaves, se os tokens passarem a ser emitidos
  por um provedor de identidade real em vez de tokens estáticos de teste.

## Riscos conhecidos em aberto
- Os tokens de teste são estáticos, com validade curta (7 dias) e sem revogação.
- Se uma chave privada de teste for versionada no repositório, ela é pública por
  definição: serve só para este desafio e nunca deve ser reaproveitada.
# Limites

Documento vivo: atualizo conforme o projeto avança.

## O que não fiz (até agora)
- JWKS: a API valida o JWT com uma chave pública fixa, guardada em base64 na variável de ambiente JWT_PUBLIC_KEY_B64. Não há rotação de chaves.
- Reconexão automática: se a conexão com o RabbitMQ cair, a API não reconecta sozinha e as publicações passam a falhar até reiniciar o processo.

## O que faria com mais tempo
- Migrar para JWKS com rotação de chaves, se os tokens passarem a ser emitidos por um provedor de identidade real em vez de tokens estáticos de teste.
- Outbox pattern: gravar o evento numa tabela na mesma transação da corrida e publicar depois, eliminando o risco de dual write.
- Reconexão com backoff no publicador de eventos.
- Usuário próprio no RabbitMQ, em vez do guest padrão.

## Riscos conhecidos em aberto
- Os tokens de teste são estáticos, com validade curta (7 dias) e sem revogação.
- Se uma chave privada de teste for versionada no repositório, ela é pública por definição: serve só para este desafio e nunca deve ser reaproveitada.
- Dual write: a corrida é gravada no MySQL e o evento é publicado em seguida.
  Se a API cair entre as duas operações, o evento se perde e o cache e o histórico ficam sem aquela atualização.
- Credencial padrão (guest/guest) no RabbitMQ, aceitável só no ambiente local.
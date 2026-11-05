# Limites

Documento vivo: atualizo conforme o projeto avança.

## O que não fiz
- **Kubernetes (Parte 3) e KEDA:** não entreguei. Não tenho experiência prévia com
  Kubernetes e preferi não incluir manifestos que eu não saberia explicar. O
  raciocínio está no DECISIONS.md (entrada 7).
- **JWKS:** a API valida o JWT com uma chave pública fixa, em base64 na variável
  `JWT_PUBLIC_KEY_B64`. Não há rotação de chaves.
- **Spans de banco no trace:** o Prisma não aparece no trace; o trace
  cobre HTTP, RabbitMQ e Redis.
- **Expiração das chaves de idempotência:** a tabela cresce sem limpeza.

## O que faria com mais tempo
- Estudar Kubernetes (Deployment, Service, probes, resources, ConfigMap e Secret)
  e subir a API e o worker em um cluster local.
- Outbox pattern: gravar o evento numa tabela na mesma transação da corrida e
  publicar depois, eliminando o risco de dual write.
- Reconexão com backoff e retry com espera antes da DLQ.
- JWKS com rotação de chaves, se os tokens vierem de um provedor de identidade real.
- Limpeza (TTL) das chaves de idempotência.
- Usuário próprio no RabbitMQ, em vez do `guest` padrão.
- Dockerfiles multi-stage e migrações de banco como um passo separado do start.
- Teste automatizado de requisições simultâneas com a mesma Idempotency-Key e
  teste do worker contra um RabbitMQ real.

## Riscos conhecidos em aberto
- **Dual write:** a corrida é gravada no MySQL e o evento é publicado em seguida.
  Se a API cair entre as duas operações, o evento se perde e o cache e o histórico
  ficam sem aquela atualização.
- **Consistência eventual:** um GET logo depois de um PATCH pode mostrar o status
  antigo, até o worker atualizar o cache.
- **Tokens de teste estáticos**, com validade longa e sem revogação. A chave privada de teste está versionada no
  repositório, então é pública por definição e serve só para este desafio.
- **Credencial padrão (guest/guest)** no RabbitMQ, aceitável só no ambiente local.
- **Migração ao iniciar a API:** com várias réplicas subindo ao mesmo tempo, poderia
  haver corrida; não testei esse cenário.
- **Limiares dos alertas** calibrados com o teste de carga em uma máquina local com
  Docker; não representam produção.
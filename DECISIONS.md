# Decisões

## 1. Topologia do RabbitMQ
- **Contexto:** a API precisa avisar o worker a cada corrida criada ou alterada,
  sem esperar o processamento, e nenhum evento pode se perder se o worker estiver parado.
- **Alternativas:** publicar direto numa fila (sem exchange); exchange fanout;
  exchange topic.
- **Escolha:** exchange `topic` (`corridas.events`) com a fila durável
  `corridas.worker` ligada a `corrida.*`, mensagens persistentes e confirm channel
  na API. Uma DLX (`corridas.dlx`) com a DLQ `corridas.worker.dlq` recebe as
  mensagens rejeitadas. A API também declara a topologia, para que eventos
  publicados antes de o worker subir fiquem guardados na fila em vez de descartados.
- **Trade-off:** mais objetos para entender e manter.

## 2. Trava otimista no PATCH de status
- **Contexto:** dois motoristas podem tentar aceitar a mesma corrida ao mesmo tempo.
- **Alternativas:** trava pessimista (SELECT ... FOR UPDATE); fila de comandos; 
trava otimista com coluna version.
- **Escolha:** o update só acontece se a version ainda for a que li; senão responde
409. Só uma das requisições vence.
- **Trade-off:** o cliente que perde precisa tentar de novo; em troca, não mantenho
bloqueios no banco.

## 3. MySQL e MongoDB: o que fica em cada um
- **Contexto:** preciso de uma fonte da verdade consistente e de um histórico de
  eventos que só cresce.
- **Alternativas:** tudo no MySQL (tabela de eventos com coluna JSON); tudo no Mongo.
- **Escolha:** MySQL guarda as corridas (transações, constraints, trava otimista
  por `version`). Mongo guarda o histórico append-only, com payload variável e
  crescimento independente.
- **Trade-off:** mais um serviço para operar e histórico com atraso em relação ao
  MySQL. Em um sistema menor, a tabela JSON no MySQL seria mais simples.

## 4. Autenticação: JWT RS256 com chave pública
- **Contexto:** a API precisa validar o token e distinguir passageiro de motorista.
- **Alternativas:** HS256 (segredo compartilhado); RS256 com chave pública em
  variável de ambiente; RS256 com JWKS.
- **Escolha:** RS256 com chave pública fixa, em base64 numa variável de ambiente
  (`JWT_PUBLIC_KEY_B64`). A API só verifica; quem obtiver a pública não consegue
  forjar tokens. Token ausente ou inválido responde 401; perfil sem permissão, 403.
- **Trade-off:** sem rotação de chaves (o JWKS resolveria) e tokens de teste
  estáticos, sem revogação.

## 5. Stack: NestJS, Prisma 7 e worker em Node puro
- **Contexto:** tempo curto e a intenção de gastar a energia no que é novo
  (RabbitMQ, OpenTelemetry), não em ferramentas que já domino.
- **Alternativas:** Express/Fastify; Prisma 6; TypeORM; worker também em NestJS.
- **Escolha:** NestJS + Prisma 7 na API (com o driver adapter do MariaDB, que o
  Prisma 7 exige para MySQL) e um worker em Node + TypeScript sem framework, porque
  ele só consome mensagens.
- **Trade-off:** o Prisma 7 mudou a configuração (`prisma.config.ts`, cliente
  gerado dentro de `src`, adapter) em relação ao Prisma 6; precisei adaptar.

## 6. Priorização: a Parte 3 (Kubernetes) ficou de fora
- **Contexto:** o tempo é limitado, a Parte 1 tem prioridade e a Parte 3 tem peso
  médio. Não tenho experiência prévia com Kubernetes.
- **Alternativas:** copiar manifestos de exemplo sem entendê-los; entregar só o
  manifesto da API; não entregar a parte.
- **Escolha:** não entregar a Parte 3 e investir o tempo em testes, observabilidade
  e documentação, registrando a lacuna no LIMITES.md.
- **Trade-off:** perco os pontos dessa parte; em troca, entrego só o que consigo
  explicar e defender.

## 7. Manter o RabbitMQ ou escolher outro broker (obrigatória)
- **Contexto:** se eu desenvolvesse este sistema do zero, sem tecnologias
  definidas, que broker usaria para levar os eventos da corrida até o worker?
- **Alternativas:** RabbitMQ; Kafka; Amazon SQS/SNS; Redis Streams.
- **Escolha:** Manteria o RabbitMQ neste caso. O fluxo é de fila de trabalho: cada
  evento deve ser processado por um consumidor e confirmado, o roteamento por tipo
  é simples e o volume é moderado. O RabbitMQ entrega isso de forma nativa (ack,
  DLQ, roteamento por topic). E ainda pode ser usado em comunicação com diferentes 
  tipo de linguagem.
# Corridas: desafio técnico (Pessoa Engenheira Full Stack / Platform, Pleno)

Versão simplificada do fluxo central do Taxi.Rio: passageiros solicitam corridas,
motoristas alteram o status e o sistema acompanha o estado em tempo quase real.

## Arquitetura

```
[React UI] --HTTP + JWT--> [API NestJS] --> MySQL (fonte da verdade)
                               |
                               +-- evento --> [RabbitMQ] --> [Worker Node] --> Redis (cache de status)
                                                                         +--> MongoDB (histórico)
```

- **API:** `POST /corridas`, `PATCH /corridas/:id/status`, `GET /corridas/:id` (lê
  do cache) e `GET /corridas` (lista as corridas do passageiro).
- **Worker:** consome `corrida.criada` e `corrida.status_alterado`, atualiza o
  cache e grava o histórico, tolerando mensagens duplicadas.
- **Observabilidade:** logs JSON com `correlation_id`, métricas Prometheus,
  trace no Jaeger e dois alertas.

## Como subir (só precisa de Docker)

```bash
git clone https://github.com/fanuelcouto99/desafio-iplanrio.git
cd desafio-iplanrio
docker compose up -d --build
docker compose ps   # aguarde os serviços ficarem Up/healthy
```

A API aplica as migrações do banco ao iniciar.

| Serviço | URL |
|---|---|
| UI | http://localhost:5173 |
| API | http://localhost:3000 |
| RabbitMQ (guest/guest) | http://localhost:15672 |
| Prometheus e alertas | http://localhost:9090 e http://localhost:9090/alerts |
| Jaeger | http://localhost:16686 |

Para derrubar tudo: `docker compose down -v`.

## Tokens de teste

Chaves e tokens abaixo são **de teste**, só para este desafio. Nunca reutilize.

```bash
export TP='eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXNzYWdlaXJvLTEiLCJyb2xlIjoicGFzc2FnZWlybyIsImlhdCI6MTc5MzgzMTUxNCwiZXhwIjoxNzk0NDM2MzE0LCJpc3MiOiJjb3JyaWRhcy10ZXN0ZSJ9.gkL932ZeP1vJXnyD-xcp3EMrlDEuglBWsWi2MpcaJdJkjpuZq-ZpF5OE2NLLtNc7ZtU4sRS1VMDq5oaHQEjmoAJb8G7D6YukwWVXkNUws-cwbFSr2E4IxCSlUSIOTMUu_O6U-LxDwaHle-9WyUvtm8SxiZoNs-82aAqSvYkmPXXRglNP_6-UNlLIqY1t_7Zz69shJrHVCXLZu7uN1EGZmbuddkadq0riqessYw25xSwewGX_TCO-0RRD5Ihlb83odZPxouuXmrXmOPUMIsZ57DIKQzQG7hs9FThOmnP_aPOZBhqIrRn0DKL-JnhNPiXr4kkSsaM_1WOZqssPUBoeiQ'
export TP2='eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwYXNzYWdlaXJvLTIiLCJyb2xlIjoicGFzc2FnZWlybyIsImlhdCI6MTc5MzgzMTUxNCwiZXhwIjoxNzk0NDM2MzE0LCJpc3MiOiJjb3JyaWRhcy10ZXN0ZSJ9.g5AdRXKVk-n7koBsriOO9p6X8Fh98IxkFp6D6gMWXuluP6vIjjC8eL45JMAB8FHju8u8s7SqBxkW9s-IIqQrQW4BSz6_EyQ0g_m4mc82RtfTcANHOy6E568_FpXkySyjjvcSR0XBC-dS5HEpn7E7HyAYApbpS95LfY8NlWUwcFgJosOnTat_I8Mllor3E_ar7YP3RM01Z-CCOm55gAcld-4F4P47e_NjM9bpVK2afwdSjC_WCzmClXL_vPxeoong9pi9nRcdV0rgZmILV7YkZlnEz0kWqOgEQ9uDqiUZjHQvJqnaO_nUdsc8o7I3SIbRkkoL4PGc7XPuU22kWbcb-g'
export TM='eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb3RvcmlzdGEtMSIsInJvbGUiOiJtb3RvcmlzdGEiLCJpYXQiOjE3OTM4MzE1MTQsImV4cCI6MTc5NDQzNjMxNCwiaXNzIjoiY29ycmlkYXMtdGVzdGUifQ.Vg9YDquQAoqOMwhIrXvcYFG9KlNRexKfmyuYClU39QjQ16y6llOJvdmIuPrUoUEAu36GJtvLA2_fy6oLIZoAPL2EPWWthW7lny1Hsr9l7NMr1Hql_jNw-plbqAyp4QNUItsa0RId_vFTgHE6l5rMwkHVbIhJbrvX8pZandUvxqTyfpC5P8u2ZZl_1k8t5Yy0YrFyMfdWBzTNivbDe8KgTJ3PQWaKkUFGKkw62AMsstIsDX6l-ph8Lq3Dnir-jgelx0WUT_P2JJGfjblC-fmu3JHF7sd32dnR1_TRWoNJQwxWfFN-lS7q7T-GNUI1cytJPGbOeYNxPFXnODAsGZwKDQ'
```

## Como validar

### Autenticação e perfis

```bash
# sem token => 401
curl -i -X POST http://localhost:3000/corridas

# token inválido => 401
curl -i -X POST http://localhost:3000/corridas -H 'Authorization: Bearer abc'

# passageiro cria => 201 (anote o id)
curl -i -X POST http://localhost:3000/corridas -H "Authorization: Bearer $TP" -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-1' -d '{"origem":"Centro","destino":"Barra"}'

# motorista tentando criar => 403
curl -i -X POST http://localhost:3000/corridas -H "Authorization: Bearer $TM" -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-2' -d '{"origem":"A","destino":"B"}'

# passageiro tentando alterar status => 403 (troque ID pelo id da corrida)
curl -i -X PATCH http://localhost:3000/corridas/ID/status -H "Authorization: Bearer $TP" -H 'Content-Type: application/json' -d '{"status":"ACEITA"}'

# motorista aceita => 200
curl -i -X PATCH http://localhost:3000/corridas/ID/status -H "Authorization: Bearer $TM" -H 'Content-Type: application/json' -d '{"status":"ACEITA"}'

# outro passageiro lendo a corrida => 403
curl -i http://localhost:3000/corridas/ID -H "Authorization: Bearer $TP2"
```

### Idempotência

Repita exatamente o mesmo `POST` com `Idempotency-Key: demo-1`: a resposta é `200`
com o **mesmo id** e continua existindo uma só corrida. Com a mesma chave e corpo
diferente a resposta é `422`.

### Mensagem duplicada no worker

No painel do RabbitMQ, em Exchanges, `corridas.events`, aba Publish message, use a
routing key `corrida.status_alterado` e cole o corpo de um evento já processado
(o `eventId` está no Mongo). Esperado: o log `evento duplicado ignorado` no worker
e nenhum documento novo. Para ver o log: `docker compose logs worker`.

❯ curl -i -X PATCH http://localhost:3000/corridas/ID/status -H "Authorization: Bearer $TP" -H 'Content-Type: application/json' -d '{"status":"ACEITA"}'
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
x-correlation-id: b9ebf851-64ea-4830-8ba6-4987e2af18ed
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 43
ETag: W/"2b-dGnJzt6gv1nJjX6DJ9RztDWptng"
Date: Thu, 05 Nov 2026 21:03:35 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"message":"Unauthorized","statusCode":401}%

## Testes automatizados

Rodam a cada push no GitHub Actions. Para rodar localmente (precisa de Node 22.12+):

```bash
docker compose up -d mysql redis mongo rabbitmq
docker compose exec mysql mysql -uroot -proot-teste -e 'CREATE DATABASE IF NOT EXISTS corridas_test;'
cd api && npm ci && npx prisma generate && DATABASE_URL='mysql://root:root-teste@localhost:3306/corridas_test' npx prisma migrate deploy && npm run test:e2e
cd ../worker && npm ci && npm test
```

Cenários: fluxo feliz, idempotência, 401/403, transição inválida de status (API) e
evento duplicado e evento fora de ordem (worker).

## Observabilidade

- **Logs:** `docker compose logs api worker | grep <correlation_id>`. O id entra
  pelo header `x-correlation-id` (ou é gerado) e viaja na mensagem do RabbitMQ.
- **Métricas:** `/metrics` na API; o worker expõe as dele, e o Prometheus coleta as duas e o tamanho da fila.
- **Trace:** Jaeger, serviços `corridas-api` e `corridas-worker`.
- **Alertas:** `observability/alerts.yml` (carregado pelo Prometheus) e
  `observability/alerts-prometheusrule.yaml` (mesmas regras como PrometheusRule).
  Justificativa dos limiares: [RESUMA COM OS NÚMEROS QUE VOCÊ MEDIU NO K6].

## O que não foi entregue

A Parte 3 (Kubernetes) não foi entregue. Veja [k8s/README.md](k8s/README.md),
[LIMITES.md](LIMITES.md) e a entrada 6 do [DECISIONS.md](DECISIONS.md).

## Declaração de uso de IA

## Declaração de uso de IA

**Ferramentas:** Claude (chat) e Cursor.

**Para que usei:**
- **Entender o desafio e planejar:** pedi ajuda para interpretar o enunciado,
  priorizar as partes e definir a ordem de trabalho.
- **Aprender conceitos novos para mim:** RabbitMQ, Kubernetes, Prometheus,
  Jaeger/OpenTelemetry e o papel do MongoDB no sistema. Não tinha experiência
  prévia com essas ferramentas.
- **Guia de etapas com exemplos de código:** gerei um roteiro de trabalho com
  trechos de exemplo (compose, idempotência, worker, alertas, k6, manifestos
  do Kubernetes) e os usei como ponto de partida, não como entrega final.
- autocompletar/boilerplate no editor, depuração de erros, revisão
  de texto do DECISIONS.md e LIMITES.md.

**O que fiz sem IA:** decisões do DECISIONS.md (exceto a primeira), diagnóstico dos problemas do diário, toda a 
parte da ui, gerenciamento das corridas.

**Como revisei:** executei o que foi gerado, li linha a linha e reescrevi ou
removi o que não consegui explicar.

**Exemplo de sugestão que corrigi/rejeitei:**
Ao rodar o Github Actions ele quebrou no processo do Worker, por que não encontrava 
localizando o script "lint:ci" no package.json, que eu havia colocado, depois de identificar removi a linha do ci.yml.

## Documentos

[DECISIONS.md](DECISIONS.md) · [DIARIO.md](DIARIO.md) · [LIMITES.md](LIMITES.md) · Vídeo: [LINK DO VÍDEO]
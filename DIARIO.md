## 03-11-2026
- 19:43: Li o documento enviado e decidi usar NestJS, Prisma e MySQL, que são ferramentas que já domino e quero gastar mais tempo com o que é novo para mim (RabbitMQ, Kubernetes e OTel).

- 20:22: Tive um erro ao rodar o docker compose, relacionado ao rabbitmq que estava com o arquivo errado, estava apenas com um ".", ao invés da configuração certa [rabbitmq_management,rabbitmq_prometheus]., corrigi ele com auxilio da IA Claude para entender do que se tratava, por ser uma ferramenta nova para mim.

## 04-11-2026
- 19:40: Decidi validar o JWT com RS256 e chave pública. A API só precisa verificar tokens, então só ela precisa da pública; a privada fica só no script que gera os tokens de teste. Com HS256 a API teria o mesmo segredo que assina, e quem o vazasse poderia forjar tokens.

- 20:02: Descartei o JWKS por enquanto: ele só vale a pena com rotação de chaves, e aqui seria mais uma peça para um token estático de teste. Aceito o trade-off de não ter rotação e registrei isso no LIMITES.md.

- 20:17: Passei a guardar em base64 numa linha só (JWT_PUBLIC_KEY_B64) e a decodificar na JwtStrategy, porque chave com várias linhas costuma quebra em .env.

## 05-11-2026
- 09:28: Decidi deixar a chave do cache no Redis como "corrida:<id>", para facilitar o entendimento e também o uso da chave na aplicação.

- 09:37: Configurei o publicador de eventos no RabbitMQ (eventos.service). Escolhi uma exchange topic com fila durável e DLX/DLQ, e decidi declarar a topologia na própria API, e não só no worker: sem fila ligada, a exchange descarta a mensagem, então um evento publicado antes de o worker subir se perderia.

- 10:11: Ao subir a API apareceu `getaddrinfo ENOTFOUND rabbitmq`. A API rodava no meu terminal, fora do Docker, mas o .env usava o nome do serviço (rabbitmq), que só existe dentro da rede do compose. Troquei para localhost no api/.env, e o .env.example continua com os nomes de serviço para quando a API rodar no contêiner.





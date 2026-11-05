import { readFileSync } from "fs";
import { join } from "path";

const keys = join(__dirname, '..', 'test-keys');
process.env.JWT_PUBLIC_KEY_B64 = readFileSync(join(keys, 'test-public.pem')).toString('base64');
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? 'mysql://root:root-teste@localhost:3306/corridas_test';
process.env.REDIS_URL = process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.RABBITMQ_URL = process.env.RABBITMQ_URL ??= 'amqp://localhost:5672';

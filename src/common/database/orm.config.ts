import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { env } from '../config';
import { SnakeNamingStrategy } from './namingStrategy.config';
import { User } from 'src/modules/auth/entity/user.entity';

export const dbConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  namingStrategy: new SnakeNamingStrategy(),
  entities: [User],
  synchronize: env.DB_SYNC,
  logger: 'advanced-console',
  logging: ['error', 'warn'],
  maxQueryExecutionTime: 100,
};

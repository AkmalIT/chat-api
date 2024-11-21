import { config } from 'dotenv';
import { bool, cleanEnv, num, str } from 'envalid';
config();

export const env = cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
  NODE_ENV: str({ choices: ['dev', 'stage', 'prod'] }),
  DB_HOST: str(),
  DB_PORT: num(),
  DB_USERNAME: str(),
  DB_PASSWORD: str(),
  DB_NAME: str(),
  DB_SYNC: bool(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  JWT_SECRET: str(),
});

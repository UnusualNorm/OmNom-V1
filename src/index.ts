console.debug('Setting up environment');
import 'dotenv-defaults/config';
import 'dotenv/config';

console.debug('Checking environment...');
const requiredEnv: Array<string> = ['DISCORD_TOKEN'];
for (let i = 0; i < requiredEnv.length; i++)
  if (!process.env[requiredEnv[i]])
    throw new Error(
      `Required property: '${requiredEnv[i]}' not found in environment...`
    );

console.debug('Registering Sapphire plugins...');
import '@sapphire/plugin-logger/register';

console.debug('Importing native modules...');
import path from 'path';

console.debug('Importing modules...');
import { LogLevel, SapphireClient } from '@sapphire/framework';
import db from 'quick.db';

console.debug('Creating client...');
const client = new SapphireClient({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
  fetchPrefix: (message) =>
    db.get(`guild_${message.guildId}.prefix`) || process.env.DISCORD_PREFIX,
  logger: { level: parseInt(process.env.DISCORD_LOGLEVEL) || LogLevel.Error },
  baseUserDirectory: __dirname
});
console.clear();
client.logger.info('Logger set up!');

client.logger.debug('Logging in...');
client
  .login(process.env.DISCORD_TOKEN)
  .then(() => client.logger.info('Logged in to Discord!'))
  .catch((reason) =>
    client.logger.fatal(`Failed to log in to Discord...\n${reason}`)
  );

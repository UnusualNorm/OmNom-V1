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
import fs from 'fs';
import path from 'path';

console.debug('Importing modules...');
import { SapphireClient } from '@sapphire/framework';
import db from 'quick.db';

console.debug('Creating client...');
const client = new SapphireClient({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
  fetchPrefix: (message) =>
    db.get(`guild_${message.guildId}.prefix`) || process.env.DISCORD_PREFIX,
  logger: { level: parseInt(process.env.DISCORD_LOGLEVEL) },
  baseUserDirectory: __dirname,
});
const { logger } = client;
console.clear();
logger.info('Logger set up!');

logger.debug('Listening for ready...');
client.on('ready', () => {
  logger.info('Client is ready!');

  logger.debug('Setting up presence loop...');
  const updatePresence = () => {
    client.user.setPresence({
      activities: [
        {
          name: `around in ${client.guilds.cache.size} guilds!`,
          type: 'PLAYING',
        },
      ],
    });
    logger.info('Updated presence!');
  };

  setInterval(() => updatePresence, 600000);
  logger.debug('Manually updating presence...');
  updatePresence();
});

logger.debug('Logging in...');
client
  .login(process.env.DISCORD_TOKEN)
  .then(() => logger.info('Logged in to Discord!'))
  .catch((reason) => logger.fatal(`Failed to log in to Discord...\n${reason}`));

function shutdown() {
  logger.info('Shutting down!');
  client.destroy();
}

logger.debug('Listening for SIGTERM...');
process.on('SIGTERM', () => {
  logger.debug('Recieved SIGTERM...');
  shutdown();
});

logger.debug('Setting up uncaught exception catchers...');
const log_file_err = fs.createWriteStream('error.log', {
  flags: 'a',
});

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
  log_file_err.write(err + '\n');
});

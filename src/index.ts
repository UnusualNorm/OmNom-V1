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
import http from 'http';

console.debug('Importing modules...');
import { SapphireClient } from '@sapphire/framework';
import db from 'quick.db';
import express from 'express';
import ngrok from 'ngrok';

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

function shutdown(code = 0) {
  logger.info('Shutting down!');
  client.destroy();
  process.exit(code);
}

logger.debug('Listening for SIGTERM...');
process.on('SIGTERM', () => {
  logger.debug('Recieved SIGTERM...');
  shutdown();
});

logger.debug('Listening for uncaught exceptions...');
process.on('uncaughtException', function (err) {
  logger.error('Uncaughtaught exception: ' + err);
  fs.writeFileSync('error.log', `${err.name}\n${err.message}\n${err.stack}`);
  shutdown(1);
});

if (!fs.existsSync('public/')) {
  logger.debug('Creating public directory...');
  fs.mkdirSync('public/');
}

logger.debug('Creating server...');
const app = express();
const server = http.createServer(app);

logger.debug('Routing server...');
app.use(express.static('public/'));

logger.debug('Listening to port...');
server.listen(parseInt(process.env.PORT));

if (process.env.NGROK_APIKEY) {
  logger.debug('Starting ngrok...');
  ngrok
    .authtoken(process.env.NGROK_APIKEY)
    .then(() => ngrok.connect(parseInt(process.env.PORT)))
    .then((link) => {
      logger.info(`Started Ngrok at '${link}'!`);
      process.env.SERVER_IP = link;
    });
} else if (!process.env.SERVER_IP)
  throw new Error('No Ngrok token or server ip specified...');

import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message } from 'discord.js';

@ApplyOptions<Command.Options>({
  name: 'eval',
})
export class EvalCommand extends Command {
  public messageRun(message: Message) {
    const { client, author } = message;
    const { logger } = client;
    if (author.id && author.id == process.env.DISCORD_OWNERID) {
      const args = message.content.split(' ');
      args.shift();
      const code = args.join(' ');
      try {
        message.reply('```' + eval(code) + '```');
      } catch (error) {
        logger.error(`Encountered eval error...\n${error}`);
        message.reply('Error: ```' + error + '```');
      }
    } else message.reply('😒');
  }
}

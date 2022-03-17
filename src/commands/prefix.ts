import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { Message } from 'discord.js';
import db from 'quick.db';

@ApplyOptions<Command.Options>({
  name: 'prefix',
  description: 'Check the prefix for your server!',
  requiredClientPermissions: ['SEND_MESSAGES'],
})
export class EvalCommand extends Command {
  public messageRun(message: Message, args: Args) {
    const { client, member, guild, channel } = message;
    const { logger } = client;
    const prefix = args.next();
    if (!prefix)
      message.reply(
        `The prefix for this server is: '${client.fetchPrefix(message)}'!`
      );
    else if (
      (channel.type == 'GUILD_TEXT' || channel.isThread()) &&
      channel.permissionsFor(member).has('MANAGE_GUILD')
    ) {
      db.set(`guild_${guild.id}.prefix`, prefix);
      message.reply(`The prefix is now: '${prefix}'!`);
    } else
      message.reply(
        `You do not have the required permissions to change the prefix...`
      );
  }
}

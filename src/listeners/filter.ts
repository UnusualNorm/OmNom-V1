import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { Message } from 'discord.js';
import { filter } from '../shared/filter';

@ApplyOptions<ListenerOptions>({
  event: 'messageCreate',
})
export class MessageMoveShorthand extends Listener {
  run(message: Message) {
    const { guild, channel, author, content, client } = message;
    if (
      !(channel.type == 'GUILD_TEXT' || channel.isThread()) ||
      !channel.permissionsFor(guild.me).has('MANAGE_MESSAGES') ||
      !channel.permissionsFor(guild.me).has('MANAGE_WEBHOOKS') ||
      message.webhookId ||
      author.bot ||
      content.startsWith(client.fetchPrefix(message).toString())
    )
      return;
    filter(message);
  }
}

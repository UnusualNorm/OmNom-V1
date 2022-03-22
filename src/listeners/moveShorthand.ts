import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { Message } from 'discord.js';
import db from 'quick.db';
import { move } from '../shared/move';

@ApplyOptions<ListenerOptions>({
  event: 'messageCreate',
})
export class MessageMoveShorthand extends Listener {
  run(message: Message) {
    const { guild, client } = message;
    if (
      message.type == 'REPLY' &&
      db.get(`guild_${guild.id}.move.shorthand`) &&
      // Check if the message is just the prefix
      message.content.replace(/<#([0-9]*)>/g, '').trim() ==
        client.fetchPrefix(message)
    )
      move(message);
  }
}

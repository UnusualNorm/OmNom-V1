import { ApplyOptions } from '@sapphire/decorators';
import { Listener, ListenerOptions } from '@sapphire/framework';
import { Message } from 'discord.js';
import db from 'quick.db';
import { move } from '../shared/message';

@ApplyOptions<ListenerOptions>({
  event: 'messageCreate',
})
export class MessageMoveShorthand extends Listener {
  run(message: Message) {
    const { guild } = message;
    const { logger } = this.container;
    if (
      message.type == 'REPLY' &&
      message.content.replace(/<#([0-9]*)>/g, '').trim() == ''
    ) {
      logger.debug('Found replace message shorthand...');
      if (db.get(`guild_${guild.id}.message.shorthand`)) {
        move(message);
      }
    }
  }
}

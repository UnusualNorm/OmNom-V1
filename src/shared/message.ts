import { ensureGetWebhook, messageToWebhook } from '../util/webhook';
import { container } from '@sapphire/framework';
import { Message, WebhookMessageOptions } from 'discord.js';
const { logger } = container;
import db from 'quick.db';
import { separateThread } from '../util/channel';

export function move(message: Message) {
  const { channel, guild, member, author } = message;
  if (
    !(channel.type == 'GUILD_TEXT' || channel.isThread()) ||
    !channel.permissionsFor(guild.me).has('MANAGE_MESSAGES') ||
    !channel.permissionsFor(member).has('MANAGE_MESSAGES')
  )
    return message.reply('I cannot move messages from this channel...');

  message.fetchReference().then((targetMessage) => {
    const targetChannel = message.mentions.channels.first();
    if (!targetChannel)
      return message.reply('You did not specify a channel...');
    if (targetChannel.type != 'GUILD_TEXT' && !targetChannel.isThread())
      return message.reply('I cannot move messages to that channel...');

    const { channel, threadId } = separateThread(targetChannel);
    ensureGetWebhook(channel, (error, webhook) => {
      if (error) return message.reply(error);

      const override: WebhookMessageOptions = { threadId };
      //TODO: Prepend the reference user if targetMessage is type 'reply'
      if (db.get(`guild_${guild.id}.message.signature`)) {
        override.content = `${targetMessage.content}\n- <@${author.id}> moved <@${targetMessage.author.id}>'s message from <#${targetMessage.channelId}>`;
        logger.debug('Added signature...');
      }

      messageToWebhook(targetMessage, webhook, override, (error) => {
        if (error) return message.reply(error);

        targetMessage
          .delete()
          .then(() => message.delete())
          .catch((error) => {
            logger.error(`Failed to delete messages...\n${error}`);
            message.reply('Failed to delete message... (Check permissions?)');
          });
      });
    });
  });
}

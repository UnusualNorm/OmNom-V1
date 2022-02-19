import { ensureGetWebhook, messageToWebhook } from '../util/webhook';
import { container } from '@sapphire/framework';
import { Message } from 'discord.js';
const { logger } = container;
import db from 'quick.db';
import { separateThread } from '../util/channel';

export function move(message: Message) {
  const { channel, guild, member, author } = message;
  if (
    channel.type ==
      ('GUILD_TEXT' || 'GUILD_PUBLIC_THREAD' || 'GUILD_PRIVATE_THREAD') &&
    channel.permissionsFor(guild.me).has('MANAGE_MESSAGES') &&
    channel.permissionsFor(member).has('MANAGE_MESSAGES')
  ) {
    logger.debug('Can run replace message...');
    message.fetchReference().then((targetMessage) => {
      const targetChannel = message.mentions.channels.first();
      if (!targetChannel) {
        logger.warn('No channel mention found...');
        message.reply('No channel specified...');
      }
      logger.debug('Found target channel...');

      if (targetChannel.type == 'GUILD_TEXT' || targetChannel.isThread()) {
        const { channel, threadId } = separateThread(targetChannel);
        ensureGetWebhook(channel, (webhook) => {
          if (!webhook)
            return message.reply(
              'Failed to get/create webhook... (Check permissions?)'
            );
          logger.debug('Got webhooks...');

          let override = message.content;
          //TODO: Prepend the reference user if targetMessage is type 'reply'
          if (db.get(`guild_${guild.id}.message.signature`)) {
            override += `\n- <@${author.id}> moved <@${targetMessage.author.id}>'s message from <#${targetMessage.channelId}>`;
            logger.debug('Added signature...');
          }

          messageToWebhook(
            targetMessage,
            webhook,
            (success) => {
              logger.debug('Finished running message to webhook...');
              if (success)
                targetMessage
                  .delete()
                  .then(() => {
                    logger.info('Moved message!');
                    message.delete();
                  })
                  .catch((error) => {
                    logger.error(
                      `Failed to delete target message...\n${error}`
                    );
                    message.reply(
                      'Failed to delete target message... (Check permissions?)'
                    );
                  });
              else
                message.reply(
                  'Failed to send webhook message... (Check permissions?)'
                );
            },
            threadId,
            override
          );
        });
      } else {
        logger.warn('Tried to move a non-guild message...');
        message.reply('You can only use this command in a server!');
      }
    });
  }
}

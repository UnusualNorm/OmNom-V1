import { ensureGetWebhook, messageToWebhook } from '../util/webhook';
import { container } from '@sapphire/framework';
import { Message, WebhookMessageOptions } from 'discord.js';
import db from 'quick.db';
import { separateThread } from '../util/channel';
const { logger } = container;

// TODO: Seperate into 2 functions (reference/permission fetcher, and message mover)
export function move(message: Message) {
  const { channel, guild, member, author } = message;
  // Check permissions, and make sure we're in a supported channel
  if (
    !(channel.type == 'GUILD_TEXT' || channel.isThread()) ||
    !channel.permissionsFor(guild.me).has('MANAGE_MESSAGES') ||
    !channel.permissionsFor(member).has('MANAGE_MESSAGES')
  )
    return message.reply('I cannot move messages from this channel...');

  message
    .fetchReference()
    .then((targetMessage) => {
      // Make sure we can move to the channel
      const targetChannel = message.mentions.channels.first();
      if (!targetChannel)
        return message.reply('You did not specify a channel...');
      if (targetChannel.type != 'GUILD_TEXT' && !targetChannel.isThread())
        return message.reply(
          'I cannot move messages to that tytpe of channel...'
        );

      // Sepereate thread from channel to grab webhook
      const { channel, threadId } = separateThread(targetChannel);
      ensureGetWebhook(channel, (error, webhook) => {
        if (error) return message.reply(error);

        const override: WebhookMessageOptions = { threadId };
        override.content = targetMessage.content;

        const finish = () => {
          // Add the signature if signing is enabled
          if (db.get(`guild_${guild.id}.move.signature`)) {
            override.content += `\n- <@${author.id}> moved <@${targetMessage.author.id}>'s message from <#${targetMessage.channelId}>`;
            logger.debug('Added signature...');
          }

          // Send the webhook message
          messageToWebhook(targetMessage, webhook, override, (error) => {
            if (error) return message.reply(error);

            // Delete message and target
            targetMessage
              .delete()
              .then(() => message.delete())
              .catch((error) => {
                logger.error(`Failed to delete messages...\n${error}`);
                message.reply(
                  'Failed to delete messages... (Check permissions?)'
                );
              });
          });
        };

        // If target is a reply, ping the author
        if (targetMessage.type == 'REPLY')
          message
            .fetchReference()
            .then(
              (targetMessageTarget) =>
                (override.content = `<@${targetMessageTarget.author.id}> ${override.content}`)
            )
            .catch((error) =>
              logger.warn(
                `Failed to fetch reference message reference...\n${error}`
              )
            )
            .finally(finish);
        else finish();
      });
    })
    .catch((error) => {
      logger.error(`Failed te fetch messagre reference...\n${error}`);
    });
}

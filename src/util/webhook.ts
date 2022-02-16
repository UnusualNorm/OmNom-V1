import { container } from '@sapphire/framework';
const { logger, client } = container;

import { TextChannel, Webhook, Message } from 'discord.js';

export function ensureGetWebhook(
  channel: TextChannel,
  cb: (webhook?: Webhook) => unknown
) {
  if (channel.permissionsFor(channel.guild.me).has('MANAGE_WEBHOOKS')) {
    const { guild } = channel;

    logger.debug('Getting webhooks...');
    channel
      .fetchWebhooks()
      .then((webhooks) => {
        logger.debug('Finding webhook...');
        const webhook = webhooks.find((wh) => (wh.token ? true : false));
        if (webhook) {
          cb(webhook);
        } else {
          logger.debug('Creating webhook...');
          channel
            .createWebhook(
              guild.me.nickname ? guild.me.nickname : client.user.username,
              {
                avatar: guild.me.displayAvatarURL(),
              }
            )
            .then((webhook) => {
              logger.info('Created webhook!');
              cb(webhook);
            })
            .catch((error) => {
              logger.error(`Failed to create webhook...\n${error}`);
              cb();
            });
        }
      })
      .catch((error) => {
        logger.error(`Failed to fetch webhooks...\n${error}`);
        cb();
      });
  } else {
    logger.warn("Can't use webhooks in the requested channel...");
    cb();
  }
}

export function messageToWebhook(
  message: Message,
  webhook: Webhook,
  cb: (success: boolean) => unknown,
  threadId?: string
) {
  const { author, member, attachments, content } = message;
  webhook
    .send({
      avatarURL: member.displayAvatarURL(),
      username: member.nickname ? member.nickname : author.username,
      content,
      files: attachments.toJSON(),
      threadId,
    })
    .then(() => cb(true))
    .catch((error) =>
      logger.error(`Failed to send message to webhook...\n${error}`)
    );
}

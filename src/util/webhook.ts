import { container } from '@sapphire/framework';
import { APIMessage } from 'discord-api-types';
const { logger, client } = container;

import {
  TextChannel,
  Webhook,
  Message,
  WebhookMessageOptions,
} from 'discord.js';

export function ensureGetWebhook(
  channel: TextChannel,
  cb: (error?: string, webhook?: Webhook) => unknown
) {
  const { guild } = channel;
  if (!channel.permissionsFor(channel.guild.me).has('MANAGE_WEBHOOKS'))
    return cb("I don't have webhook permissions for the channel!");

  logger.debug('Getting webhooks...');
  channel
    .fetchWebhooks()
    .then((webhooks) => {
      logger.debug('Finding webhook...');
      const webhook = webhooks.find((wh) => (wh.token ? true : false));
      if (webhook) {
        cb(null, webhook);
      } else {
        logger.debug('Creating webhook...');
        channel
          .createWebhook(
            guild.me.nickname ? guild.me.nickname : client.user.username,
            {
              avatar: guild.me.displayAvatarURL
                ? guild.me.displayAvatarURL()
                : client.user.avatarURL(),
            }
          )
          .then((webhook) => cb(null, webhook))
          .catch((error) => {
            logger.error(`Failed to create webhook...\n${error}`);
            cb(
              "I couldn't create a webhook for the channel... (Do I have permissions?)"
            );
          });
      }
    })
    .catch((error) => {
      logger.error(`Failed to fetch webhooks...\n${error}`);
      cb(
        "I couldn't get the webhooks for the channel... (Do I have permissions?)"
      );
    });
}

export function convertMessage(message: Message): WebhookMessageOptions {
  const { author, member, content, attachments } = message;
  return {
    avatarURL: member.displayAvatarURL(),
    username: member?.nickname ? member.nickname : author.username,
    content,
    files: attachments.toJSON(),
    //TODO: Add embeds...
  };
}

export function messageToWebhook(
  message: Message,
  webhook: Webhook,
  override?: WebhookMessageOptions,
  cb?: (error: string, msg?: Message | APIMessage) => unknown
) {
  const messageOptions = convertMessage(message);
  const webhookOptions: WebhookMessageOptions = {
    ...messageOptions,
    ...override,
  };

  webhook
    .send(webhookOptions)
    .then((msg) => cb(null, msg))
    .catch((error) => {
      logger.error(`Failed to send message as webhook...\n${error}}`);
      cb("I couldn't send the message... (Do I have permissions?)");
    });
}

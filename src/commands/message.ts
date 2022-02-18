import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import { ensureGetWebhook, messageToWebhook } from '../util/webhook';
import { separateThread } from '../util/channel';
import db from 'quick.db';

@ApplyOptions<SubCommandPluginCommand.Options>({
  subCommands: ['move', 'toggle', { input: 'help', default: true }],
  name: 'message',
  requiredClientPermissions: ['MANAGE_MESSAGES'],
  requiredUserPermissions: ['MANAGE_MESSAGES'],
})
export class UserCommand extends SubCommandPluginCommand {
  public move(message: Message) {
    const { logger } = this.container;
    const { guild, author } = message;

    if (message.type == 'REPLY') {
      message.fetchReference().then((targetMessage) => {
        const targetChannel = message.mentions.channels.first();
        if (!targetChannel) {
          logger.warn('No channel mention found...');
          message.reply('No channel specified...');
        }

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
    } else {
      logger.warn('Message was not a reply...');
      message.reply('You must reply to a message to use this command!');
    }
  }

  public toggle(message: Message, args: Args) {
    const { logger } = this.container;
    const { guild, channel } = message;
    if (channel.type != 'GUILD_TEXT' && !channel.isThread()) {
      logger.warn('Command ran in non-server...');
      return message.reply('This command must be ran in a server...');
    }

    const genericToggles: Array<string> = ['shorthand', 'signature'];
    let foundToggle = false;
    const feature = args.next();
    for (let i = 0; i < genericToggles.length; i++) {
      const toggle = genericToggles[i];
      if (feature == toggle) {
        foundToggle = true;
        logger.info(`Set message feature toggle: '${toggle}'!`);
        const enabled = db.get(`guild_${guild.id}.message.${toggle}`);
        const toggleTarget = enabled ? false : true;
        db.set(`guild_${guild.id}.message.${toggle}`, toggleTarget);
        message.reply(`${toggleTarget?'Enabled':'Disabled'} message feature: '${toggle}'!`);
      }
    }

    switch (feature) {
      default:
        if (!foundToggle) {
          logger.warn('Message feature not found...');
          message.reply(`Invalid feature: '${feature}'...`);
        }
        break;
    }
  }

  public help(message: Message) {
    const { logger } = this.container;

    logger.debug('Creating embed...');
    const embed = new MessageEmbed().setTitle('Message | Help').setFields([
      { name: 'help', value: 'Shows this help menu!' },
      {
        name: 'move',
        value: 'Move messages to a different channel! (REPLY ONLY)',
      },
      {
        name: 'toggle',
        value: 'Toggles different features! (shorthand)',
      },
    ]);

    logger.debug('Sending embed...');
    message
      .reply({ embeds: [embed] })
      .then(() => {
        logger.info('Sent help message!');
      })
      .catch((reason) => {
        logger.error(`Failed to reply to send message...\n${reason}`);
      });
  }
}

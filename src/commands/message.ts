import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import { ApplyOptions } from '@sapphire/decorators';
import type { Args } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import db from 'quick.db';
import { move } from '../shared/message';

@ApplyOptions<SubCommandPluginCommand.Options>({
  subCommands: ['move', 'toggle', { input: 'help', default: true }],
  name: 'message',
  requiredClientPermissions: ['MANAGE_MESSAGES', 'SEND_MESSAGES'],
  requiredUserPermissions: ['MANAGE_MESSAGES'],
})
export class UserCommand extends SubCommandPluginCommand {
  public move(message: Message) {
    const { logger } = this.container;

    if (message.type == 'REPLY') {
      move(message);
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
        message.reply(
          `${
            toggleTarget ? 'Enabled' : 'Disabled'
          } message feature: '${toggle}'!`
        );
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

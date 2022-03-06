import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import { ApplyOptions } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import db from 'quick.db';
import { move } from '../shared/message';

const genericToggles: string[] = ['shorthand', 'signature'];
const helpEmbed = new MessageEmbed().setTitle('Message | Help').setFields([
  { name: 'help', value: 'Shows this help menu!' },
  {
    name: 'move',
    value: 'Move messages to a different channel! (REPLY ONLY)',
  },
  {
    name: 'toggle',
    value: 'Toggles different features! (shorthand | signature)',
  },
]);

@ApplyOptions<SubCommandPluginCommand.Options>({
  subCommands: ['move', 'toggle', { input: 'help', default: true }],
  name: 'message',
  requiredClientPermissions: ['MANAGE_MESSAGES', 'SEND_MESSAGES'],
  requiredUserPermissions: ['MANAGE_MESSAGES'],
})
export class UserCommand extends SubCommandPluginCommand {
  public move(message: Message) {
    if (message.type == 'REPLY') move(message);
    else message.reply('You must reply to a message to use this command!');
  }

  public toggle(message: Message, args: Args) {
    const { guild, channel } = message;
    if (channel.type != 'GUILD_TEXT' && !channel.isThread())
      return message.reply('This command must be ran in a server...');

    // Handle any generic toggles
    const feature = args.next();
    if (genericToggles.includes(feature)) {
      const enabled = db.get(`guild_${guild.id}.message.${feature}`);
      const toggleTarget = enabled ? false : true;

      // Set it and reply
      db.set(`guild_${guild.id}.message.${feature}`, toggleTarget);
      message.reply(
        `${
          toggleTarget ? 'Enabled' : 'Disabled'
        } message feature: '${feature}'!`
      );
    }
    // In case we need to do specific things
    else
      switch (feature) {
        default:
          message.reply(`Invalid feature: '${feature}'...`);
          break;
      }
  }

  public help(message: Message) {
    const { logger } = this.container;

    message
      .reply({ embeds: [helpEmbed] })
      .then(() => {
        logger.info('Sent help message!');
      })
      .catch((reason) => {
        logger.error(`Failed to reply to send message...\n${reason}`);
      });
  }
}

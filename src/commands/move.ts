import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import { ApplyOptions } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import db from 'quick.db';
import { move } from '../shared/move';

const genericToggles: string[] = ['shorthand', 'signature'];
const helpEmbed = new MessageEmbed().setTitle('Move | Help').setFields([
  { name: 'help', value: 'Shows this help menu!' },
  {
    name: 'message',
    value: 'Move a message to a different channel! (REPLY ONLY)',
  },
  {
    name: 'toggle',
    value: 'Toggles different features! (shorthand | signature)',
  },
]);

@ApplyOptions<SubCommandPluginCommand.Options>({
  subCommands: ['message', 'toggle', { input: 'help', default: true }],
  name: 'move',
  requiredClientPermissions: ['MANAGE_MESSAGES', 'SEND_MESSAGES'],
  requiredUserPermissions: ['MANAGE_MESSAGES'],
  runIn: ['GUILD_TEXT', 'GUILD_PUBLIC_THREAD', 'GUILD_PRIVATE_THREAD'],
})
export class UserCommand extends SubCommandPluginCommand {
  public message(message: Message) {
    if (message.type == 'REPLY') move(message);
    else message.reply('You must reply to a message to use this command!');
  }

  public toggle(message: Message, args: Args) {
    const { guild } = message;

    // Handle any generic toggles
    const feature = args.next();
    if (genericToggles.includes(feature)) {
      const enabled = db.get(`guild_${guild.id}.move.${feature}`);
      const toggleTarget = enabled ? false : true;

      // Set it and reply
      db.set(`guild_${guild.id}.move.${feature}`, toggleTarget);
      message.reply(
        `${toggleTarget ? 'Enabled' : 'Disabled'} move feature: '${feature}'!`
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

    message.reply({ embeds: [helpEmbed] }).catch((reason) => {
      logger.error(`Failed to reply to send message...\n${reason}`);
    });
  }
}

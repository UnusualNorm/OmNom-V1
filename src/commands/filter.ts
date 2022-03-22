import { SubCommandPluginCommand } from '@sapphire/plugin-subcommands';
import { ApplyOptions } from '@sapphire/decorators';
import { Args } from '@sapphire/framework';
import { Message, MessageEmbed } from 'discord.js';
import db from 'quick.db';
import { filter, filters, toggleDBFilter } from '../shared/filter';

const genericToggles: string[] = [];
const helpEmbed = new MessageEmbed().setTitle('Filter | Help').setFields([
  { name: 'help', value: 'Shows this help menu!' },
  {
    name: 'message',
    value: 'Filters a message! (REPLY ONLY)',
  },
  {
    name: 'toggle',
    value: 'Add/remove a filter from all specified mentions!',
  },
]);

function toggleBase(message: Message, args: Args, enabled: boolean) {
  const { guild } = message;
  const filter = args.next().toLowerCase();

  if (filters.has(filter)) {
    if (message.mentions.everyone)
      toggleDBFilter(enabled, `guild_${guild.id}.filter.filters`, filter);

    message.mentions.roles.forEach((role) =>
      toggleDBFilter(
        enabled,
        `guild_${guild.id}.roles.${role.id}.filter.filters`,
        filter
      )
    );
    message.mentions.channels.forEach((channel) =>
      toggleDBFilter(
        enabled,
        `guild_${guild.id}.channels.${channel.id}.filter.filters`,
        filter
      )
    );
    message.mentions.members.forEach((member) =>
      toggleDBFilter(
        enabled,
        `guild_${guild.id}.members.${member.id}.filter.filters`,
        filter
      )
    );

    message.reply(
      `${enabled ? 'Added' : 'Removed'} filter: '${filter}' ${
        enabled ? 'to' : 'from'
      } all specified mentions!`
    );
  } else message.reply(`The filter: '${filter}' doesn't exist...`);
}

@ApplyOptions<SubCommandPluginCommand.Options>({
  subCommands: [
    'message',
    'toggle',
    { input: 'help', default: true },
    'add',
    'remove',
  ],
  name: 'filter',
  requiredClientPermissions: [
    'MANAGE_MESSAGES',
    'SEND_MESSAGES',
    'MANAGE_WEBHOOKS',
  ],
  requiredUserPermissions: ['MANAGE_MESSAGES'],
  runIn: ['GUILD_TEXT', 'GUILD_PUBLIC_THREAD', 'GUILD_PRIVATE_THREAD'],
})
export class UserCommand extends SubCommandPluginCommand {
  public message(message: Message, args: Args) {
    const filterName = args.next().toLowerCase();
    if (!filters.has(filterName))
      return message.reply(`The filter: '${filterName}' doesn't exist...`);

    if (message.type == 'REPLY')
      message.fetchReference().then((target) => {
        filter(target, [filters.get(filterName)]);
      });
    else message.reply('You must reply to a message to use this command!');
  }

  public add(message: Message, args: Args) {
    toggleBase(message, args, true);
  }
  public remove(message: Message, args: Args) {
    toggleBase(message, args, false);
  }

  public toggle(message: Message, args: Args) {
    const { guild } = message;

    // Handle any generic toggles
    const feature = args.next();
    if (genericToggles.includes(feature)) {
      const enabled = db.get(`guild_${guild.id}.filter.${feature}`);
      const toggleTarget = enabled ? false : true;

      // Set it and reply
      db.set(`guild_${guild.id}.filter.${feature}`, toggleTarget);
      message.reply(
        `${toggleTarget ? 'Enabled' : 'Disabled'} filter feature: '${feature}'!`
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

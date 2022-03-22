import {
  convertMessage,
  ensureGetWebhook,
  messageToWebhook,
} from '../util/webhook';
import { container } from '@sapphire/framework';
import { Message, WebhookMessageOptions } from 'discord.js';
const { logger } = container;
import db from 'quick.db';
import { separateThread } from '../util/channel';
import Filter from '../Filter';
import path from 'path';
import fs from 'fs';

export const filters = new Map<string, Filter>();
fs.readdirSync(path.join(__dirname, '../filters')).forEach(
  async (filterFile) => {
    const filter: { default: Filter } = (
      await import(path.join(__dirname, '../filters', filterFile))
    ).default;
    if (filter instanceof Filter) filters.set(filter.name, filter);
  }
);

function parseFilterList(list: string[] = []): Filter[] {
  const filterList: Filter[] = [];
  for (let i = 0; i < list.length; i++) {
    const filterName = list[i];
    const filter = filters.get(filterName);

    if (filter) filterList.push(filter);
    else logger.warn(`Unidentified filter found: '${filterName}'...`);
  }
  return filterList;
}

export function filter(message: Message) {
  const { channel, guild, member } = message;
  if (
    !(channel.type == 'GUILD_TEXT' || channel.isThread()) ||
    !channel.permissionsFor(guild.me).has('MANAGE_MESSAGES') ||
    !channel.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')
  )
    return message.reply(
      'I cannot filter messages from this channel... (Do I have permissions?)'
    );
  const seperate = separateThread(channel);

  ensureGetWebhook(seperate.channel, (error, webhook) => {
    if (error) return message.reply(error);

    let filterList: Filter[] = [];
    // Guild
    filterList = filterList.concat(
      parseFilterList(db.get(`guild_${guild.id}.filter.filters`))
    );

    // Roles
    if (!message.webhookId) {
      const roles = member.roles.cache.toJSON()||[];
      for (let i = roles.length - 1; i >= 0; i--) {
        const role = roles[i];
        filterList = filterList.concat(
          parseFilterList(
            db.get(`guild_${guild.id}.roles.${role.id}.filter.filters`)
          )
        );
      }
    }

    // Channel
    filterList = filterList.concat(
      parseFilterList(
        db.get(`guild_${guild.id}.channels.${channel.id}.filter.filters`)
      )
    );

    // Member
    if (!message.webhookId)
      filterList = filterList.concat(
        parseFilterList(
          db.get(`guild_${guild.id}.members.${member.id}.filter.filters`)
        )
      );

    const next = (i: number, text: string, override: WebhookMessageOptions) => {
      if (i < filterList.length)
        return filterList[i].run(
          text,
          (text: string, override: WebhookMessageOptions) => {
            i++;
            next(i, text, override);
          },
          override
        );

      override.threadId = seperate.threadId;
      override.content = text || '[removed]';
      override.username = override.username || '[deleted]';

      messageToWebhook(message, webhook, override, (error) => {
        if (error) return message.reply(error);

        message.delete().catch((error) => {
          logger.error(`Failed to delete messages...\n${error}`);
          message.reply('Failed to delete messages... (Check permissions?)');
        });
      });
    };
    filterList.reverse();
    if (filterList.length > 0)
      next(0, message.content, convertMessage(message));
  });
}

export function toggleDBFilter(
  enable: boolean,
  filterPath: string,
  filter: string
) {
  let thingFilters: string[] = db.get(filterPath) || [];
  if (filters.has(filter) && !thingFilters.includes(filter) && enable)
    thingFilters.push(filter);
  else if (!enable) thingFilters = thingFilters.filter((f) => f != filter);
  db.set(filterPath, thingFilters);
}
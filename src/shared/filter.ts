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

// Import filters from filters folder
export const filters = new Map<string, Filter>();
fs.readdirSync(path.join(__dirname, '../filters')).forEach(
  async (filterFile) => {
    // Import the filter
    const filter: { default: Filter } = (
      await import(path.join(__dirname, '../filters', filterFile))
    ).default;
    // Make sure it's a filter
    if (filter instanceof Filter) filters.set(filter.name, filter);
    else logger.warn(`Non-filter '${filterFile}' found in filters...`);
  }
);

// Convert array of filter names to filters
export function parseFilterList(list: string[]): Filter[] {
  const filterList: Filter[] = [];
  if (!list) return [];
  // Loop through and parse the filters
  for (let i = 0; i < list.length; i++) {
    const filterName = list[i];
    const filter = filters.get(filterName);

    // Make sure it's a valid filter
    if (filter) filterList.push(filter);
    else logger.warn(`Unidentified filter found: '${filterName}'...`);
  }
  return filterList;
}

export function getMessageFilters(message: Message): Filter[] {
  const { member, channel, guild } = message;
  // Make sure we're in a supported filter channel
  if (!(channel.type == 'GUILD_TEXT' || channel.isThread())) return [];

  const seperate = separateThread(channel);
  let filterList: Filter[] = [];
  // Get guild filters
  filterList = filterList.concat(
    parseFilterList(db.get(`guild_${guild.id}.filter.filters`))
  );

  // Get role filters
  if (!message.webhookId) {
    const roles = member.roles.cache.toJSON() || [];
    for (let i = roles.length - 1; i >= 0; i--) {
      const role = roles[i];
      filterList = filterList.concat(
        parseFilterList(
          db.get(`guild_${guild.id}.roles.${role.id}.filter.filters`)
        )
      );
    }
  }

  // Get channel filters
  filterList = filterList.concat(
    parseFilterList(
      db.get(`guild_${guild.id}.channels.${seperate.channel.id}.filter.filters`)
    )
  );

  // Get member filters
  if (!message.webhookId)
    filterList = filterList.concat(
      parseFilterList(
        db.get(`guild_${guild.id}.members.${member.id}.filter.filters`)
      )
    );

  // Put it in execution order
  filterList.reverse();
  return filterList;
}

export function filter(message: Message, filterList: Filter[]) {
  const { channel, guild } = message;
  // Make sure we can filter
  if (!(channel.type == 'GUILD_TEXT' || channel.isThread())) return;
  const seperate = separateThread(channel);

  // Check permissions to get webhook and delete
  if (
    !channel.permissionsFor(guild.me).has('MANAGE_MESSAGES') ||
    !channel.permissionsFor(guild.me).has('MANAGE_WEBHOOKS')
  )
    return;

  ensureGetWebhook(seperate.channel, (error, webhook) => {
    if (error) return;

    const next = (i: number, text: string, override: WebhookMessageOptions) => {
      // If wer're not done, run filter and redo
      if (i < filterList.length)
        return filterList[i].run(
          text,
          (text: string, override: WebhookMessageOptions) => {
            i++;
            next(i, text, override);
          },
          override
        );

      // Make sure we send to thread
      override.threadId = seperate.threadId;
      // Set defaults
      override.content =
        text || (override.files.length > 0 ? null : '[removed]');
      override.username = override.username || '[deleted]';

      // Send message
      messageToWebhook(message, webhook, override, (error) => {
        if (error) return;

        // Delete unfiltered message
        message
          .delete()
          .catch((error) =>
            logger.error(`Failed to delete messages...\n${error}`)
          );
      });
    };

    next(0, message.content, convertMessage(message));
  });
}

export function toggleDBFilter(
  enable: boolean,
  filterPath: string,
  filter: string
) {
  let thingFilters: string[] = db.get(filterPath) || [];
  // If it exists, and we want to enable it, add it
  if (filters.has(filter) && !thingFilters.includes(filter) && enable)
    thingFilters.push(filter);
  // If we want to disable it, filter the list
  else if (!enable) thingFilters = thingFilters.filter((f) => f != filter);
  db.set(filterPath, thingFilters);
}

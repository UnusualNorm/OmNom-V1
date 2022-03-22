import { WebhookMessageOptions } from 'discord.js';

export default class Filter {
  name: string;
  description: string;
  messageOnly: boolean;
  run: (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => unknown;
}

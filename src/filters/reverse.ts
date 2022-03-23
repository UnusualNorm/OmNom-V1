import Filter from '../Filter';
import { WebhookMessageOptions } from 'discord.js';

class ReverseFilter extends Filter {
  name = 'reverse';
  description = 'Reverse Any Given Text';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    if (override)
      override.username = override.username.split('').reverse().join('');

    cb(text.split('').reverse().join(''), override);
  };
}

export default new ReverseFilter();

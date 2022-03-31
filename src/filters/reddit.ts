import Filter from '../Filter';
import { WebhookMessageOptions } from 'discord.js';

class RedditFilter extends Filter {
  name = 'reddit';
  description = '[removed]';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown
  ) => {
    // FIXME: There's probably a better way to get the discord logo...
    cb('[removed]', {
      username: '[deleted]',
      avatarURL:
        'https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico',
    });
  };
}

export default new RedditFilter();

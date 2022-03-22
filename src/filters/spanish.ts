import translate from 'translate-google';
import { WebhookMessageOptions } from 'discord.js';
import Filter from '../Filter';

class HFilter extends Filter {
  name = 'spanish';
  description = 'Translates your message into spanish!';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    translate(text, { to: 'es' })
      .then((text: string) => cb(text, override));
  };
}

export default new HFilter();

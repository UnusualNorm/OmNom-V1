import { WebhookMessageOptions } from 'discord.js';
import Filter from '../Filter';
import OWO from 'uwuifier';
const owoify = new OWO();

class HFilter extends Filter {
  name = 'owo';
  description = 'OWO-ifies your message!';
  messageOnly = false;

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    if (override)
      override.username = owoify.uwuifyWords(override.username);

    cb(owoify.uwuifySentence(text), override);
  };
}

export default new HFilter();

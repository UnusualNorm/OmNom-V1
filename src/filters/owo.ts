import { WebhookMessageOptions } from 'discord.js';
import Filter from '../Filter';
import OWO from 'uwuifier';
const owoify = new OWO();

class OWOFilter extends Filter {
  name = 'owo';
  description = 'OWO-ifies your message!';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    if (override) override.username = owoify.uwuifyWords(override.username);

    text = owoify.uwuifySentence(text);
    // FIXME: Not making asterisks visible in message
    // text.replace(/\*/g, '\\*');
    // text.replace(/`/g, '\\`');
    cb(text, override);
  };
}

export default new OWOFilter();

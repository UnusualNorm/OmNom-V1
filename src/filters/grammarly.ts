import { correct, Grammarly } from '@stewartmcgown/grammarly-api';
import { WebhookMessageOptions } from 'discord.js';
import Filter from '../Filter';
const client = new Grammarly({
  username: process.env.GRAMMARLY_USERNAME,
  password: process.env.GRAMMARLY_PASSWORD,
});

class GrammarlyFilter extends Filter {
  name = 'grammarly';
  description = 'Auto-corrects your message!';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    client
      .analyse(text)
      .then(correct)
      .then(({ corrected }) => cb(corrected, override));
  };
}

export default new GrammarlyFilter();

import Filter from '../Filter';
import { WebhookMessageOptions } from 'discord.js';

class TypoFilter extends Filter {
  name = 'typo';
  description = 'Oh slly me, I made a typpo!';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    const words = text.split(/ |\n/g);
    for (let i = 0; i < words.length; i++) {
      const word = words[i].split('');
      const character = Math.floor(Math.random() * word.length);
      if (character == 0) break;

      const left = word[character - 1];
      const right = word[character];
      word[character] = left;
      word[character - 1] = right;

      words[i] = word.join('');
    }

    text = words.join(' ');
    cb(text, override);
  };
}

export default new TypoFilter();

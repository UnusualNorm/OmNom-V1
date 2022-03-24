import { client } from 'tenorjs';
import Filter from '../Filter';
import { WebhookMessageOptions } from 'discord.js';
const Tenor = client({
  Key: process.env.TENOR_APIKEY,
  Filter: 'off',
  Locale: 'en_US',
  MediaFilter: 'minimal',
  DateFormat: 'D/MM/YYYY - H:mm:ss A',
});

class GifFilter extends Filter {
  name = 'gif';
  description = 'L + Ratio';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    if (text)
      Tenor.Search.Query(text, '1').then((res) => {
        const url = res[0].media[0].tinygif.url;
        cb(url, override);
      });
    else cb(text, override);
  };
}

export default new GifFilter();

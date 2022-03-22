import { client } from 'tenorjs';
import TextOnGif from 'text-on-gif';
import Filter from '../Filter';
import { MessageAttachment, WebhookMessageOptions } from 'discord.js';
const Tenor = client({
  Key: process.env.TENOR_APIKEY, // https://tenor.com/developer/keyregistration
  Filter: 'off', // "off", "low", "medium", "high", not case sensitive
  Locale: 'en_US', // Your locale here, case-sensitivity depends on input
  MediaFilter: 'minimal', // either minimal or basic, not case sensitive
  DateFormat: 'D/MM/YYYY - H:mm:ss A', // Change this accordingly
});

class reverseFilter extends Filter {
  name = 'gif';
  description = 'Turns your message into a gif!';
  
  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    if (text)
      Tenor.Search.Query(text, '1').then((res) => {
        const url = res[0].media[0].tinygif.url;
        cb(url, override);
        //-------------------------------------
        //--Code for beta text-on-gif feature--
        //-------------------------------------
        /*
        const buff = Buffer.from(text);
        const base64data = buff.toString('base64');
        const savePath = `public/${base64data}.gif`;

        // Math stuff
        const textWidth = 32;
        const borderWidth = 4;

        new TextOnGif({
          file_path: url,
          alignment_y: 'top',
          font_color: 'black',
          font_size: `${textWidth}px`,
          stroke_color: 'white',
          stroke_width: borderWidth,
        })
          .textOnGif({
            text: text,
            get_as_buffer: false,
            write_path: savePath,
          })
          .then(() => {
            cb(`${process.env.SERVER_IP}/${base64data}.gif`, override);
          });
          */
      });
    else cb(text, override);
  };
}

export default new reverseFilter();

// https://github.com/dnorhoj/h/

import { WebhookMessageOptions } from 'discord.js';
import Filter from '../Filter';

function stringToBinary(str: string, spaceSeparatedOctets: boolean): string {
  function zeroPad(num: string) {
    return '00000000'.slice(String(num).length) + num;
  }

  return str.replace(/[\s\S]/g, function (str) {
    str = zeroPad(str.charCodeAt(0).toString(2));
    return !1 == spaceSeparatedOctets ? str : str + ' ';
  });
}

/*
function binaryToString(str: string): string {
  str = str.replace(/\s+/g, '');
  str = str.match(/.{1,8}/g).join(' ');

  const newBinary = str.split(' ');
  const binaryCode = [];

  for (let i = 0; i < newBinary.length; i++) {
    binaryCode.push(String.fromCharCode(parseInt(newBinary[i], 2)));
  }
  return binaryCode.join('');
}

function deH(h: string): string {
  let hh = h;
  hh = hh.replace(new RegExp(' ', 'g'), '');
  hh = hh.replace(new RegExp('h', 'g'), '0');
  hh = hh.replace(new RegExp('H', 'g'), '1');
  return hh;
}
*/

function H(h: string): string {
  let hh = h;
  hh = hh.replace(new RegExp(' ', 'g'), '');
  hh = hh.replace(new RegExp('0', 'g'), 'h');
  hh = hh.replace(new RegExp('1', 'g'), 'H');
  return hh;
}

class HFilter extends Filter {
  name = 'h';
  description = 'hHhhhhHhhHHHhhHhhHHHhHhHhHHhHhhhhhHhHHHhhhHhHHHhhhHhHHHh';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    if (override)
      override.username = H(stringToBinary(override.username, false));

    cb(H(stringToBinary(text, false)), override);
  };
}

export default new HFilter();

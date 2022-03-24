import translate from '@vitalets/google-translate-api';
import { WebhookMessageOptions } from 'discord.js';
import Filter from '../Filter';

// https://github.com/Schotsl/Uwuifier/blob/main/utils.ts
export function isUri(value: string): boolean {
  if (!value) return false;

  // Check for illegal characters
  if (/[^a-z0-9:/?#[\]@!$&'()*+,;=.\-_~%]/i.test(value)) return false;

  // Check for hex escapes that aren't complete
  if (/%[^0-9a-f]/i.test(value) || /%[0-9a-f](:?[^0-9a-f]|$)/i.test(value))
    return false;

  // Directly from RFC 3986
  const split = value.match(
    /(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
  );

  if (!split) return false;

  const [, scheme, authority, path] = split;

  // Scheme and path are required, though the path can be empty
  if (!(scheme && scheme.length && path.length >= 0)) return false;

  // If authority is present, the path must be empty or begin with a /
  if (authority && authority.length)
    if (!(path.length === 0 || /^\//.test(path))) return false;
    else if (/^\/\//.test(path))
      // If authority is not present, the path must not start with //
      return false;

  // Scheme must begin with a letter, then consist of letters, digits, +, ., or -
  if (!/^[a-z][a-z0-9+\-.]*$/.test(scheme.toLowerCase())) return false;

  return true;
}

class SpanishFilter extends Filter {
  name = 'spanish';
  description = '*Spanish noises intensify...*';

  run = (
    text: string,
    cb: (text: string, override?: WebhookMessageOptions) => unknown,
    override?: WebhookMessageOptions
  ) => {
    translate(text, { to: 'es' }).then(({ text }) => {
      const split = text.split(' ');
      for (let i = 0; i < split.length; i++) {
        const word = split[i];
        if (isUri(word))
          split[
            i
          ] = `https://translate.google.com/translate?sl=auto&tl=es&u=${encodeURIComponent(
            word
          )}`;
      }

      const newText = split.join(' ');
      cb(newText, override);
    });
  };
}

export default new SpanishFilter();

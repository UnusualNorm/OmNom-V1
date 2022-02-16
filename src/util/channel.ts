import { ThreadChannel, TextChannel } from 'discord.js';

interface separateThreadOutput {
  channel: TextChannel;
  threadId?: string;
}
export function separateThread(
  channel: ThreadChannel | TextChannel
): separateThreadOutput {
  const output: separateThreadOutput = { channel: undefined };
  if (channel.isThread()) {
    if (channel.parent.type != 'GUILD_TEXT') return;
    output.threadId = channel.id;
    output.channel = channel.parent;
  } else {
    output.channel = channel;
  }
  return output;
}

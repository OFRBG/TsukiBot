/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Kraken from "./kraken";
import Coinbase from "./coinbase";

export type MessageHandler = (tokens: readonly string[]) => Promise<string>;
export type CommandMatcher = (command: string) => boolean;

export type Handler = {
  readonly handler: MessageHandler;
  readonly matcher: CommandMatcher;
};

const handlers: readonly Handler[] = [Kraken, Coinbase];

export default handlers;

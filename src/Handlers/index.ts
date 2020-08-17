import Kraken from "./kraken";
import Coinbase from "./coinbase";
import CoinMarketCap from "./coinmarketcap";

export type MessageHandler = (tokens: readonly string[]) => Promise<string>;
export type CommandMatcher = (command: string) => boolean;

export type Handler = {
  readonly handler: MessageHandler;
  readonly matcher: CommandMatcher;
};

const handlers: readonly Handler[] = [Kraken, Coinbase, CoinMarketCap];

export default handlers;

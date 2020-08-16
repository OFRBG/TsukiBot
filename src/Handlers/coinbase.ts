/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from "axios";
import Cache from "../Cache";
import { CommandMatcher, MessageHandler } from ".";

const ServerCache = new Cache();

type CoinbasePrice = {
  readonly last: string;
  readonly volume: string;
};

const formatMessage = (price: string, volume: string): string => {
  return `${price} ${volume}`;
};

const checkCache = (pair: string): readonly [string, string] | undefined => {
  const price = ServerCache.get(`coinbase.${pair}.price`);
  const volume = ServerCache.get(`coinbase.${pair}.volume`);

  if (price && volume) {
    return [price, volume];
  }

  return undefined;
};

const matcher: CommandMatcher = command =>
  ["g", "cb", "coinbase"].includes(command);

const handler: MessageHandler = async ([coin1 = "BTC", coin2 = "USD"]) => {
  const pair = `${coin1}-${coin2}`;

  const cache = checkCache(pair);

  if (cache) {
    return formatMessage(...cache);
  }

  const url = `https://api.pro.coinbase.com/products/${pair}/stats`;

  const { data } = await axios.get<CoinbasePrice>(url);

  if (!data) {
    return `Pair ${pair} not found`;
  }

  const { last, volume } = data;

  ServerCache.set(`kraken.${pair}.price`, last, 10 * 1000);
  ServerCache.set(`kraken.${pair}.volume`, volume, 10 * 1000);

  return formatMessage(last, volume);
};

export default { matcher, handler };

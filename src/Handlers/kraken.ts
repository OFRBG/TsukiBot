/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from "axios";
import { values } from "lodash";
import Cache from "../Cache";
import { CommandMatcher, MessageHandler } from ".";

const ServerCache = new Cache();

type KrakenPrice = {
  readonly error: readonly string[];
  readonly result: {
    readonly [pair: string]: {
      readonly c: readonly [string];
      readonly v: readonly [number, number];
    };
  };
};

const formatMessage = (price: string, volume: number): string => {
  return `${price} ${volume}`;
};

const checkCache = (pair: string): readonly [string, number] | undefined => {
  const price = ServerCache.get(`kraken.${pair}.price`);
  const volume = ServerCache.get(`kraken.${pair}.volume`);

  if (price && volume) {
    return [price, volume];
  }

  return undefined;
};

const matcher: CommandMatcher = command => ["k", "kraken"].includes(command);

const handler: MessageHandler = async ([coin1 = "XBT", coin2 = "USD"]) => {
  const pair = `${coin1}${coin2}`;

  const cache = checkCache(pair);

  if (cache) {
    return formatMessage(...cache);
  }

  const url = "https://api.kraken.com/0/public/Ticker";

  const { data } = await axios.get<KrakenPrice>(url, { params: { pair } });

  if (!data.result) {
    return `Pair ${pair} not found`;
  }

  const pairData = values(data.result)[0];

  const {
    c: [lastPrice],
    v: [, volume]
  } = pairData;

  ServerCache.set(`kraken.${pair}.price`, lastPrice, 10 * 1000);
  ServerCache.set(`kraken.${pair}.volume`, volume, 10 * 1000);

  return formatMessage(lastPrice, volume);
};

export default { matcher, handler };

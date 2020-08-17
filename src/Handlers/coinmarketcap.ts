import axios from "axios";
import { reduce, mapValues, toUpper, keys } from "lodash";
import { CommandMatcher, MessageHandler } from ".";
import env from "env-var";
import Cache from "Cache";

type CMCPrice = {
  readonly status: any;
  readonly data: {
    readonly [key: string]: {
      readonly symbol: string;
      readonly cmc_rank: number;
      readonly quote: {
        readonly [key: string]: {
          readonly price: number;
          readonly volume_24h: number;
        };
      };
    };
  };
};

const CMC_OPTS =
  "num_market_pairs,cmc_rank,date_added,tags,platform,max_supply,circulating_supply,total_supply,market_cap_by_total_supply,volume_24h_reported,volume_7d,volume_7d_reported,volume_30d,volume_30d_reported,is_active,is_fiat";

const ServerCache = new Cache();

const apiKey = env
  .get("CMC_KEY")
  .required()
  .asString();

// Hours/Credits * Seconds/Hours * Milliseconds/Seconds
const ttl = (24 / 333) * 3600 * 1000;

const checkCache = (coinList: readonly string[]) => {
  return reduce(
    coinList,
    (cache, ticker) => {
      const cached = ServerCache.get(`cmc.${ticker}`);

      if (!cached) {
        return cache;
      }

      return {
        ...cache,
        [ticker]: cached
      };
    },
    {}
  );
};

const formatMessage = (coinData: { readonly [key: string]: any }): string => {
  return reduce(
    coinData,
    (messages: readonly string[], tickerInfo, symbol) => {
      const message = `${symbol}: ${parseInt(tickerInfo.price).toFixed(6)}USD`;

      return [...messages, message];
    },
    []
  ).join("\n");
};

const matcher: CommandMatcher = command => ["c", "cmc"].includes(command);

const handler: MessageHandler = async (coinList: readonly string[]) => {
  const coins = coinList.length > 0 ? coinList : ["BTC", "ETH"];

  const cached = checkCache(coinList.map(toUpper));

  if (keys(cached).length === coins.length) {
    return formatMessage(cached);
  }

  const url =
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";

  const { data } = await axios.get<CMCPrice>(url, {
    headers: { "X-CMC_PRO_API_KEY": apiKey },
    params: {
      symbol: coins.join(","),
      skip_invalid: true,
      aux: CMC_OPTS
    }
  });

  const coinData = mapValues(data.data, ({ cmc_rank, quote, symbol }) => {
    return ServerCache.set(
      `cmc.${symbol}`,
      {
        rank: cmc_rank,
        volume: quote.USD.volume_24h,
        price: quote.USD.price
      },
      ttl
    );
  });

  return formatMessage(coinData);
};

export default { matcher, handler };

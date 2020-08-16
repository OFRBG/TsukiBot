import { Client, Message } from "discord.js";
import env from "env-var";
import { isNil } from "lodash";
import logger from "logger";
import { argv } from "yargs";
import { validateDevMode, getMessageProcessor, logError } from "./helpers";

/**
 * Handle server ready state
 */
export const onReady = (client: Client) => async (): Promise<void> => {
  try {
    if (!client.user) {
      logger.error("Something went terribly wrong");

      throw new Error("Client is not signed in");
    }

    logger.info("Server ready");

    if (argv.d) {
      const devId = env
        .get("DEV_ID")
        .required()
        .asString();

      logger.info(`Dev mode. Listening to ${devId}`);

      const dev = await client.users.fetch(devId);

      void dev.send("TsukiBot loaded");
    }

    await client.user.setActivity(".tbhelp");
    logger.debug("Activity set");
  } catch (error) {
    logError(error);
  }
};

/**
 * Handle incoming messages
 */
export const onMessage = () => async (message: Message): Promise<void> => {
  try {
    if (validateDevMode(message) || isNil(message.author)) {
      return;
    }

    logger.silly(message.content);

    const [handler, params] = getMessageProcessor(message);

    const response = await handler(params);

    void message.channel.send(response);
  } catch (error) {
    logError(error);
  }
};

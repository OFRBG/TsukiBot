import { MessageHandler } from "Handlers";
import { Message } from "discord.js";
import env from "env-var";
import { MatchingError } from "Globals";
import _ from "lodash";
import logger from "Logger";
import { getHandler, getParams, isValidParam } from "Utils";
import { argv } from "yargs";

/**
 * Check if the sender is the dev
 */
export const validateDevMode = (message: Message): boolean =>
  argv.d && message.author.id !== env.get("DEV_ID").asString();

/**
 * Match a message against possible commands
 */
export const getMessageProcessor = ({
  content
}: Message): readonly [MessageHandler, readonly string[]] => {
  const [command, ...options] = getParams(content);

  if (_.isNil(command)) {
    throw new MatchingError("No parameters");
  }

  logger.verbose(`Tokenized command: ${command} - [${options.join(", ")}]`);

  const handler = getHandler(command);

  if (_.isNil(handler)) {
    throw new MatchingError("No command matched");
  }

  const params = options.filter(isValidParam).slice(0, 10);

  logger.info(`Matched ${command}`);

  return [handler, params];
};

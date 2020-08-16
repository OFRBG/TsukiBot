import _ from "lodash";
import { MatchingError } from "Globals";
import handlers, { MessageHandler } from "Handlers";

const pairs = [] as readonly string[];

const availablePrefixes = ["-t", ".tb"];

/**
 * Check if a value is a non empty string
 */
const isNonEmptyString = (s: string): boolean => _.isString(s) && s.length > 0;

/**
 * Check if the lead parameter contains the prefix
 */
const containsPrefix = (lead: string) => (prefix: string) =>
  lead.indexOf(prefix) === 0;

/**
 * Get the matched prefix
 */
const getMatchedPrefix = (command: string): string | undefined =>
  availablePrefixes.find(containsPrefix(command));

/**
 * Check if the lead parameter contains the prefix
 */
export const isValidParam = (value: string): boolean =>
  pairs.includes(value.toUpperCase()) || _.isNumber(parseFloat(value));

/**
 * Find the command handler for the given comment
 */
export const getHandler = (command: string): MessageHandler | undefined => {
  const { handler } = handlers.find(({ matcher }) => matcher(command)) || {};

  return handler;
};

/**
 * Parse a raw message into handler parameters
 */
export const getParams = (content: string): readonly string[] => {
  const [command, ...options] = content.split(" ").filter(isNonEmptyString);

  if (_.isNil(command)) {
    throw new MatchingError("No content");
  }

  const matchedPrefix = getMatchedPrefix(command);

  if (matchedPrefix == null) {
    throw new MatchingError("No prefix");
  }

  return _.compact([command.replace(matchedPrefix, ""), ...options]);
};

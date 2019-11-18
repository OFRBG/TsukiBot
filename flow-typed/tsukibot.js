// @flow

declare type Handler = (coins: string[]) => Promise<string>

declare type Matcher = (command: string) => boolean

declare type CommandHandler = {
  handler: Handler,
  matcher: Matcher,
}

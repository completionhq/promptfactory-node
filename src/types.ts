import { ChatCompletionMessageParam } from 'openai/resources';
import { FileSerializationFormat } from './file-serializer';

export enum PromptParser {
  FString = 'f-string',
}

export type PromptArguments = Record<string, string | number | boolean>;
export interface AbstractPromptFactoryOptions {
  promptArguments?: PromptArguments;
  parser?: PromptParser;
  fileSerializationFormat?: FileSerializationFormat;
  promptTemplate?: string;
  messagesTemplate?: Array<ChatCompletionParameter>;
}

// We use never to prevent both promptTemplate and messagesTemplate from being set at the same time.
export type StringPromptFactoryOptions = AbstractPromptFactoryOptions & {
  promptTemplate: string;
  messagesTemplate?: never;
};

export type MessageArrayPromptFactoryOptions = AbstractPromptFactoryOptions & {
  messagesTemplate: Array<ChatCompletionParameter>;
  promptTemplate?: never;
};

export const hasPromptTemplate = (
  options: StringPromptFactoryOptions | MessageArrayPromptFactoryOptions,
): options is StringPromptFactoryOptions => {
  return options.promptTemplate !== undefined;
};

export const hasMessagesTemplate = (
  options: StringPromptFactoryOptions | MessageArrayPromptFactoryOptions,
): options is MessageArrayPromptFactoryOptions => {
  return options.messagesTemplate !== undefined;
};

export type ChatCompletionParameter = ChatCompletionMessageParam;

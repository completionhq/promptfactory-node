import { ChatCompletionMessageParam } from 'openai/resources';
import { FileSerializationFormat } from './file-serializer';

export enum PromptParser {
  FString = 'f-string',
}

export type PromptArguments = Record<string, string | number | boolean>;
export interface AbstractPromptFactoryOptions {
  template?: string | Array<ChatCompletionParameter>;
  promptArguments?: PromptArguments;
  parser?: PromptParser;
  fileSerializationFormat?: FileSerializationFormat;
}

// We use never to prevent both promptTemplate and messagesTemplate from being set at the same time.
export type StringPromptFactoryOptions = AbstractPromptFactoryOptions & {
  template: string;
};

export type MessageArrayPromptFactoryOptions = AbstractPromptFactoryOptions & {
  template: Array<ChatCompletionParameter>;
};

export const hasPromptTemplate = (
  options: StringPromptFactoryOptions | MessageArrayPromptFactoryOptions,
): options is StringPromptFactoryOptions => {
  return typeof options.template === 'string';
};

export const hasMessagesTemplate = (
  options: StringPromptFactoryOptions | MessageArrayPromptFactoryOptions,
): options is MessageArrayPromptFactoryOptions => {
  return Array.isArray(options.template);
};

export type ChatCompletionParameter = ChatCompletionMessageParam;

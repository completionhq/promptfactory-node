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

// Define an enumeration for supported serialization formats
export enum PromptSerializationFormat {
  JSON = 'json',
  CUSTOM = 'custom',
}

export type CustomPromptSerializationFormat = {
  customRoleDelimiter: string;
  customLineDelimiter: string;
  customNameDelimiter: string;
};

export const DEFAULT_LINE_DELIMITER = '<&&pf-line&&>';
export const DEFAULT_ROLE_DELIMITER = '=>>';
export const DEFAULT_NAME_DELIMITER = '$$';

export const DEFAULT_CUSTOM_PROMPT_SERIALIZATION_FORMAT: CustomPromptSerializationFormat = {
  customRoleDelimiter: DEFAULT_ROLE_DELIMITER,
  customLineDelimiter: DEFAULT_LINE_DELIMITER,
  customNameDelimiter: DEFAULT_NAME_DELIMITER,
};

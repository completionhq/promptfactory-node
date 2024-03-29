import { ChatCompletionMessageParam } from 'openai/resources';
import { FileSerializationFormat } from './file-serializer';

export enum PromptParser {
  FString = 'f-string',
}

export type PromptArguments = Record<string, string | number | boolean>;
export interface PromptOptions {
  promptTemplate?: string;
  messagesTemplate?: Array<ChatCompletionParameter>;
  promptArguments?: PromptArguments;
  file?: string;
  parser?: PromptParser;
  fileSerializationFormat?: FileSerializationFormat;
}

export type ChatCompletionParameter = ChatCompletionMessageParam;

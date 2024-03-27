export enum PromptParser {
  FString = 'f-string',
  Jinja2 = 'jinja2',
  Handlebars = 'handlebars',
}

export type PromptArguments = Record<string, string | number>;
export interface PromptOptions {
  promptTemplate?: string;
  promptArguments?: PromptArguments;
  file?: string;
  parser?: PromptParser;
}

// Modeled after the ChatCompletionMessageParam type by OpenAI, but more specific
export type ChatCompletionParameter = {
  role: string;
  content: string;
};

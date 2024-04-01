import { FileSerializationFormat, loadPromptFromFile } from './file-serializer';
import {
  AbstractPromptFactoryOptions as AbstractPromptOptions,
  ChatCompletionParameter,
  CustomPromptSerializationFormat,
  MessageArrayPromptFactoryOptions as MessageArrayPromptOptions,
  PromptArguments,
  PromptParser,
  PromptSerializationFormat,
  StringPromptFactoryOptions as StringPromptOptions,
} from './types';
import {
  deserializeChatCompletionParameters,
  hydrateAndValidateFStringTemplate,
  serializeChatCompletionParameters,
} from './utils';

export class AbstractPrompt {
  public name: string;

  protected template?: string | Array<ChatCompletionParameter>;

  public promptArguments?: PromptArguments;

  public parser: PromptParser = PromptParser.FString;
  public fileSerializationFormat?: FileSerializationFormat;

  protected constructor(name: string, options?: AbstractPromptOptions) {
    this.name = name;
    this.parser = options?.parser ?? PromptParser.FString;
    this.fileSerializationFormat = options?.fileSerializationFormat;
    this.template = options?.template;
    this.promptArguments = options?.promptArguments;
    this.fileSerializationFormat =
      options?.fileSerializationFormat ?? FileSerializationFormat.JSON;
  }

  static _unsafeCreate(
    name: string,
    options: AbstractPromptOptions,
  ): AbstractPrompt {
    return new AbstractPrompt(name, options);
  }

  _getRawTemplate(): string | Array<ChatCompletionParameter> | undefined {
    return this.template;
  }

  _setRawTemplate(template: string | Array<ChatCompletionParameter>): void {
    this.template = template;
  }

  protected validatePromptOrMessagesTemplate(
    template: string | Array<ChatCompletionParameter>,
    promptArguments: PromptArguments,
    parser: PromptParser,
    promptSerializationFormat: PromptSerializationFormat = PromptSerializationFormat.JSON,
    customFormat?: CustomPromptSerializationFormat,
  ): string {
    if (promptSerializationFormat === PromptSerializationFormat.CUSTOM) {
      if (customFormat === undefined) {
        throw new Error('Custom format is not provided');
      }
    }

    let hydratedTemplate: string;
    const templateAsString = Array.isArray(template)
      ? serializeChatCompletionParameters(template, {
          format: promptSerializationFormat,
          customFormat: customFormat,
        })
      : template;
    switch (parser) {
      case PromptParser.FString:
        hydratedTemplate = hydrateAndValidateFStringTemplate(
          templateAsString,
          promptArguments,
        );
        break;
      default:
        throw new Error('Invalid parser provided');
    }
    return hydratedTemplate;
  }

  upsertPromptArguments(args: PromptArguments): void {
    this.promptArguments = { ...this.promptArguments, ...args };
  }

  setPromptArguments(args: PromptArguments): void {
    const template = this.template;
    if (template !== undefined) {
      this.validatePromptOrMessagesTemplate(template, args, this.parser);
    }

    this.promptArguments = args;
  }

  validate(): void {
    const template = this.template;
    if (template === undefined) {
      throw new Error('Prompt or messages template is not set');
    }
    this.validatePromptOrMessagesTemplate(
      template,
      this.promptArguments ?? {},
      this.parser,
    );
  }
}

export class StringPrompt extends AbstractPrompt {
  constructor(name: string, options?: StringPromptOptions) {
    super(name, options);
    this.template = options?.template;
  }

  static async loadPromptFromFile(file: string): Promise<StringPrompt> {
    const pf = await loadPromptFromFile(file);
    if (pf instanceof StringPrompt) {
      return pf;
    }
    throw new Error('Prompt factory is not a string prompt factory');
  }

  setPromptTemplate(template: string): void {
    this.template = template;
  }
  getPromptTemplate(): string | undefined {
    if (typeof this.template !== 'string') {
      throw new Error('Prompt template is not a string');
    }
    return this.template;
  }

  hydrate(): string {
    if (this.template === undefined) {
      throw new Error('Prompt template is not set');
    }

    if (typeof this.template !== 'string') {
      throw new Error('Prompt template is not a string');
    }

    return this.validatePromptOrMessagesTemplate(
      this.template,
      this.promptArguments ?? {},
      this.parser,
    );
  }
}

export class MessageArrayPrompt extends AbstractPrompt {
  constructor(name: string, options?: MessageArrayPromptOptions) {
    super(name, options);
    this.template = options?.template;
  }

  static async loadPromptFromFile(file: string): Promise<MessageArrayPrompt> {
    const pf = await loadPromptFromFile(file);
    if (pf instanceof MessageArrayPrompt) {
      return pf;
    }
    throw new Error('Prompt factory is not a message array prompt factory');
  }

  getMessagesTemplate(): Array<ChatCompletionParameter> | undefined {
    if (!Array.isArray(this.template)) {
      throw new Error('Messages template is not an array');
    }
    return this.template;
  }

  setMessagesTemplate(template: Array<ChatCompletionParameter>): void {
    this.template = template;
  }

  hydrate(): Array<ChatCompletionParameter> {
    if (this.template === undefined) {
      throw new Error('Messages template is not set');
    }

    if (!Array.isArray(this.template)) {
      throw new Error('Messages template is not an array');
    }

    const hydratedMessages = this.validatePromptOrMessagesTemplate(
      this.template,
      this.promptArguments ?? {},
      this.parser,
    );

    return deserializeChatCompletionParameters(hydratedMessages);
  }
  hydrateAsString: () => string = () => {
    if (this.template === undefined) {
      throw new Error('Messages template is not set');
    }

    if (!Array.isArray(this.template)) {
      throw new Error('Messages template is not an array');
    }

    const serializedPrompt = serializeChatCompletionParameters(this.template, {
      format: PromptSerializationFormat.CUSTOM,
      customFormat: {
        customLineDelimiter: '\n',
        customRoleDelimiter: ': ',
        customNameDelimiter: ' ',
      },
    });

    return hydrateAndValidateFStringTemplate(
      serializedPrompt,
      this.promptArguments ?? {},
    );
  };
}

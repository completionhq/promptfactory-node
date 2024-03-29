import { FileSerializationFormat, loadPromptFromFile } from './file-serializer';
import {
  AbstractPromptFactoryOptions,
  ChatCompletionParameter,
  MessageArrayPromptFactoryOptions,
  PromptArguments,
  PromptParser,
  StringPromptFactoryOptions,
} from './types';
import {
  PromptSerializationFormat,
  deserializeChatCompletionParameters,
  hydrateAndValidateFStringTemplate,
  serializeChatCompletionParameters,
} from './utils';

export class AbstractPromptFactory {
  public name: string;

  protected promptTemplate?: string;
  protected messagesTemplate?: Array<ChatCompletionParameter>;

  public promptArguments?: PromptArguments;

  public parser: PromptParser = PromptParser.FString;
  public fileSerializationFormat?: FileSerializationFormat;

  protected constructor(name: string, options: AbstractPromptFactoryOptions) {
    this.name = name;
    this.parser = options.parser ?? PromptParser.FString;
    this.fileSerializationFormat = options.fileSerializationFormat;
    this.promptTemplate = options.promptTemplate;
    this.messagesTemplate = options.messagesTemplate;
    this.promptArguments = options.promptArguments;
    this.fileSerializationFormat =
      options.fileSerializationFormat ?? FileSerializationFormat.JSON;
  }

  static unsafeCreate(
    name: string,
    options: AbstractPromptFactoryOptions,
  ): AbstractPromptFactory {
    return new AbstractPromptFactory(name, options);
  }

  _getPromptTemplate(): string | undefined {
    return this.promptTemplate;
  }

  _getMessagesTemplate(): Array<ChatCompletionParameter> | undefined {
    return this.messagesTemplate;
  }

  protected validatePromptOrMessagesTemplate(
    template: string | Array<ChatCompletionParameter>,
    promptArguments: PromptArguments,
    parser: PromptParser,
  ): string {
    let hydratedTemplate: string;
    const templateAsString = Array.isArray(template)
      ? serializeChatCompletionParameters(template)
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

  setPromptArguments(args: PromptArguments): void {
    const template = this.promptTemplate ?? this.messagesTemplate;
    if (template !== undefined) {
      this.validatePromptOrMessagesTemplate(template, args, this.parser);
    }

    this.promptArguments = args;
  }

  validate(): void {
    const template = this.promptTemplate ?? this.messagesTemplate;
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

export class StringPromptFactory extends AbstractPromptFactory {
  constructor(name: string, options: StringPromptFactoryOptions) {
    super(name, options);
    this.promptTemplate = options?.promptTemplate;
  }

  static async loadPromptFromFile(file: string): Promise<StringPromptFactory> {
    const pf = await loadPromptFromFile(file);
    if (pf instanceof StringPromptFactory) {
      return pf;
    }
    throw new Error('Prompt factory is not a string prompt factory');
  }

  setPromptTemplate(template: string): void {
    this.promptTemplate = template;
  }
  getPromptTemplate(): string | undefined {
    return this.promptTemplate;
  }

  getHydratedPromptString(): string {
    if (this.promptTemplate === undefined) {
      throw new Error('Prompt template is not set');
    }

    return this.validatePromptOrMessagesTemplate(
      this.promptTemplate,
      this.promptArguments ?? {},
      this.parser,
    );
  }
}

export class MessageArrayPromptFactory extends AbstractPromptFactory {
  constructor(name: string, options: MessageArrayPromptFactoryOptions) {
    super(name, options);
    this.messagesTemplate = options?.messagesTemplate;
  }

  static async loadPromptFromFile(
    file: string,
  ): Promise<MessageArrayPromptFactory> {
    const pf = await loadPromptFromFile(file);
    if (pf instanceof MessageArrayPromptFactory) {
      return pf;
    }
    throw new Error('Prompt factory is not a message array prompt factory');
  }

  getMessagesTemplate(): Array<ChatCompletionParameter> | undefined {
    return this.messagesTemplate;
  }

  setMessagesTemplate(template: Array<ChatCompletionParameter>): void {
    this.messagesTemplate = template;
  }

  getHydratedMessagesArray(): Array<ChatCompletionParameter> {
    if (this.messagesTemplate === undefined) {
      throw new Error('Messages template is not set');
    }

    const hydratedMessages = this.validatePromptOrMessagesTemplate(
      this.messagesTemplate,
      this.promptArguments ?? {},
      this.parser,
    );

    return deserializeChatCompletionParameters(hydratedMessages);
  }
  getHydratedMessagesArrayAsString: () => string = () => {
    if (this.messagesTemplate === undefined) {
      throw new Error('Messages template is not set');
    }

    const serializedPrompt = serializeChatCompletionParameters(
      this.messagesTemplate,
      {
        format: PromptSerializationFormat.CUSTOM,
        customLineDelimiter: '\n',
        customRoleDelimiter: ': ',
        customNameDelimiter: ' ',
      },
    );

    return hydrateAndValidateFStringTemplate(
      serializedPrompt,
      this.promptArguments ?? {},
    );
  };
}

import { FileSerializationFormat, loadPromptFromFile } from './file-serializer';
import {
  ChatCompletionParameter,
  PromptArguments,
  PromptOptions,
  PromptParser,
} from './types';
import {
  deserializeChatCompletionParameters,
  hydrateAndValidateFStringTemplate,
  serializeChatCompletionParameters,
} from './utils';

export class PromptFactory {
  public name: string;

  public promptTemplate?: string;
  public messagesTemplate?: Array<ChatCompletionParameter>;

  public promptArguments?: PromptArguments;

  public parser: PromptParser = PromptParser.FString;
  public fileSerializationFormat?: FileSerializationFormat;

  constructor(name: string, options?: PromptOptions) {
    this.name = name;
    this.initialize(options).catch(err => {
      throw new Error(`PromptFactory: ${err}`);
    });
  }

  private async initialize(options?: PromptOptions): Promise<void> {
    this.parser = options?.parser ?? PromptParser.FString;
    this.fileSerializationFormat =
      options?.fileSerializationFormat ?? FileSerializationFormat.YAML;

    if (options?.file) {
      const pf = await loadPromptFromFile(
        options.file,
        this.fileSerializationFormat,
      );
      this.promptTemplate = pf.promptTemplate;
      this.messagesTemplate = pf.messagesTemplate;
      this.promptArguments = pf.promptArguments;
      this.parser = pf.parser;
      // Validate the prompt arguments if they are set
      if (
        this.promptArguments &&
        (options.promptTemplate || options.messagesTemplate)
      ) {
        this.validatePromptArguments(this.promptArguments);
      }
    } else {
      if (options?.promptTemplate) {
        this.setPromptTemplate(options.promptTemplate);
      }
      if (options?.messagesTemplate) {
        this.setMessagesTemplate(options.messagesTemplate);
      }
      if (options?.parser) {
        this.parser = options.parser;
      }
      if (options?.promptArguments) {
        this.setPromptArguments(options.promptArguments);
      }
    }
  }

  private validatePromptOrMessagesTemplate(
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

  setPromptTemplate(template: string): void {
    if (this.promptArguments) {
      // Validate the prompt template if the args are set
      this.validatePromptOrMessagesTemplate(
        template,
        this.promptArguments,
        this.parser,
      );
    }

    this.promptTemplate = template;
  }

  setMessagesTemplate(template: Array<ChatCompletionParameter>): void {
    if (this.promptArguments) {
      // Validate the messages template if the args are set
      this.validatePromptOrMessagesTemplate(
        template,
        this.promptArguments,
        this.parser,
      );
    }

    this.messagesTemplate = template;
  }

  setPromptArguments(args: PromptArguments): void {
    const template = this.promptTemplate ?? this.messagesTemplate;
    if (template !== undefined) {
      this.validatePromptOrMessagesTemplate(template, args, this.parser);
    }

    this.promptArguments = args;
  }

  hydratePromptTemplate(): string {
    if (this.promptTemplate === undefined) {
      throw new Error('Prompt template is not set');
    }

    if (this.promptArguments === undefined) {
      throw new Error('Prompt arguments are not set');
    }

    return this.validatePromptOrMessagesTemplate(
      this.promptTemplate,
      this.promptArguments,
      this.parser,
    );
  }

  hydrateMessagesTemplate(): Array<ChatCompletionParameter> {
    if (this.messagesTemplate === undefined) {
      throw new Error('Messages template is not set');
    }

    if (this.promptArguments === undefined) {
      throw new Error('Prompt arguments are not set');
    }

    const hydratedMessages = this.validatePromptOrMessagesTemplate(
      this.messagesTemplate,
      this.promptArguments,
      this.parser,
    );

    return deserializeChatCompletionParameters(hydratedMessages);
  }

  private validatePromptArguments(args: PromptArguments): void {
    const template = this.promptTemplate ?? this.messagesTemplate;
    if (template === undefined) {
      throw new Error('Prompt or messages template is not set');
    }
    this.validatePromptOrMessagesTemplate(template, args, this.parser);
  }

  validatePrompt(): void {
    if (this.promptTemplate === undefined) {
      throw new Error('Prompt template is not set');
    }
    if (this.promptArguments === undefined) {
      throw new Error('Prompt arguments are not set');
    }

    this.validatePromptOrMessagesTemplate(
      this.promptTemplate,
      this.promptArguments,
      this.parser,
    );
  }
}

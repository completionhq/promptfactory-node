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

  constructor(name: string, options?: PromptOptions) {
    this.name = name;
    this.initialize(options);
  }

  private initialize(options?: PromptOptions): void {
    if (options?.file) {
      // Load from file logic here
    } else {
      if (options?.promptTemplate) {
        this.setPromptTemplate(options.promptTemplate);
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
      case PromptParser.Jinja2:
        throw new Error('Jinja2 parser is not supported');
      case PromptParser.Handlebars:
        throw new Error('Handlebars parser is not supported');
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
}

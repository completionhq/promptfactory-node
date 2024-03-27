import { ChatCompletionParameter, PromptArguments } from './types';

export const hydrateAndValidateFStringTemplate = (
  templateStr: string,
  promptArgs: PromptArguments,
): string => {
  // Adjusted regex to capture empty brackets and more accurately capture variable names
  const regex = /{{2}|}{2}|{([^{}]*)}/g;
  const foundVariables: Set<string> = new Set();

  const replacedStr = templateStr.replace(regex, (match, varName) => {
    if (match === '{{') {
      return '{';
    } else if (match === '}}') {
      return '}';
    } else if (varName === '') {
      // Handle cases where brackets are empty
      throw new Error('Template contains {} with no variables.');
    } else {
      // Check if the variable name is provided in promptArgs
      if (!(varName in promptArgs)) {
        throw new Error(`Variable "${varName}" is not provided in promptArgs.`);
      }
      foundVariables.add(varName);
      return promptArgs[varName].toString();
    }
  });

  // Check if there are more variables in promptArgs than in templateStr
  if (Object.keys(promptArgs).length > foundVariables.size) {
    throw new Error('promptArgs contains more variables than templateStr.');
  }

  return replacedStr;
};

// Define an enumeration for supported serialization formats
export enum PromptSerializationFormat {
  JSON = 'json',
  CUSTOM = 'custom',
}

export const DefaultLineDelimiter = '<&&pf-line&&>';
export const DefaultRoleDelimiter = '=>>';

// Serializer function with options for format and custom delimiters
export const serializeChatCompletionParameters = (
  messages: Array<ChatCompletionParameter>,
  options: {
    format?: PromptSerializationFormat;
    customRoleDelimiter?: string;
    customLineDelimiter?: string;
  } = {
    format: PromptSerializationFormat.CUSTOM,
    customRoleDelimiter: DefaultRoleDelimiter,
    customLineDelimiter: DefaultLineDelimiter,
  },
): string => {
  if (options.format === PromptSerializationFormat.JSON) {
    // Directly return JSON string if format is JSON\
    try {
      return JSON.stringify(messages);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `PromptFactory: Failed to stringify JSON: ${error.message}`,
        );
      }
      throw new Error('PromptFactory: Failed to stringify JSON.');
    }
  } else {
    // Use custom serialization with provided delimiter
    const delimiter = options.customRoleDelimiter ?? DefaultRoleDelimiter;
    const lineDelimiter = options.customLineDelimiter ?? DefaultLineDelimiter;

    return messages
      .map(param => `${param.role}${delimiter}${param.content}`)
      .join(lineDelimiter);
  }
};

// Deserializer function with options for format and custom delimiters
export const deserializeChatCompletionParameters = (
  serialized: string,
  options: {
    format: PromptSerializationFormat;
    customRoleDelimiter?: string;
    customLineDelimiter?: string;
  } = {
    format: PromptSerializationFormat.CUSTOM,
    customRoleDelimiter: DefaultRoleDelimiter,
    customLineDelimiter: DefaultLineDelimiter,
  },
): Array<ChatCompletionParameter> => {
  if (options.format === PromptSerializationFormat.JSON) {
    // Directly parse JSON string if format is JSON
    try {
      return JSON.parse(serialized);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `PromptFactory: Failed to parse JSON: ${error.message}`,
        );
      }
      throw new Error('PromptFactory: Failed to parse JSON.');
    }
  } else {
    // Use custom deserialization with provided delimiter
    const delimiter = options.customRoleDelimiter ?? DefaultRoleDelimiter;
    const lineDelimiter = options.customLineDelimiter ?? DefaultLineDelimiter;
    return serialized.split(lineDelimiter).map(param => {
      const delimiterIndex = param.indexOf(delimiter);
      if (delimiterIndex === -1) {
        throw new Error('Missing delimiter in input string.');
      }

      const role = param.substring(0, delimiterIndex);
      const content = param.substring(delimiterIndex + delimiter.length);

      if (role === '' || content === '') {
        throw new Error('Role or content is missing in one of the parameters.');
      }
      return { role, content };
    });
  }
};

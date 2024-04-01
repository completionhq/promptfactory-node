import {
  ChatCompletionParameter,
  CustomPromptSerializationFormat,
  DEFAULT_CUSTOM_PROMPT_SERIALIZATION_FORMAT,
  DEFAULT_LINE_DELIMITER,
  DEFAULT_NAME_DELIMITER,
  DEFAULT_ROLE_DELIMITER,
  PromptArguments,
  PromptSerializationFormat,
} from './types';

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

      // Escape special characters in the variable value that could break JSON.parse later
      const variableValue = JSON.stringify(promptArgs[varName]);
      return variableValue.substring(1, variableValue.length - 1);
    }
  });

  return replacedStr;
};

export function hasName(
  param: ChatCompletionParameter,
): param is ChatCompletionParameter & { name: string } {
  return 'name' in param && typeof param.name === 'string';
}

// Serializer function with options for format and custom delimiters
export const serializeChatCompletionParameters = (
  messages: Array<ChatCompletionParameter>,
  options: {
    format?: PromptSerializationFormat;
    customFormat?: CustomPromptSerializationFormat;
  } = {
    format: PromptSerializationFormat.JSON,
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
    if (!options.customFormat) {
      options.customFormat = DEFAULT_CUSTOM_PROMPT_SERIALIZATION_FORMAT;
    }
    // Use custom serialization with provided delimiter
    const roleDelimiter =
      options?.customFormat?.customRoleDelimiter ?? DEFAULT_ROLE_DELIMITER;
    const lineDelimiter =
      options?.customFormat?.customLineDelimiter ?? DEFAULT_LINE_DELIMITER;
    const nameDelimiter =
      options?.customFormat?.customNameDelimiter ?? DEFAULT_NAME_DELIMITER;

    return messages
      .map(param => {
        const serializedRoleAndName = hasName(param)
          ? `${param.role}${nameDelimiter}${param.name}${roleDelimiter}`
          : `${param.role}${roleDelimiter}`;
        const serializedMessage = `${serializedRoleAndName}${param.content}`;
        return serializedMessage;
      })
      .join(lineDelimiter);
  }
};

// Deserializer function with options for format and custom delimiters
export const deserializeChatCompletionParameters = (
  serialized: string,
  options: {
    format: PromptSerializationFormat;
    customFormat?: CustomPromptSerializationFormat;
  } = {
    format: PromptSerializationFormat.JSON,
    customFormat: DEFAULT_CUSTOM_PROMPT_SERIALIZATION_FORMAT,
  },
): Array<ChatCompletionParameter> => {
  if (options.format === PromptSerializationFormat.JSON) {
    // Directly parse JSON string if format is JSON
    try {
      return JSON.parse(serialized);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`PromptFactory: Failed to parse JSON: ${error}`);
      }
      throw new Error('PromptFactory: Failed to parse JSON.');
    }
  } else {
    if (!options.customFormat) {
      options.customFormat = DEFAULT_CUSTOM_PROMPT_SERIALIZATION_FORMAT;
    }
    // Use custom serialization with provided delimiter
    const roleDelimiter =
      options?.customFormat?.customRoleDelimiter ?? DEFAULT_ROLE_DELIMITER;
    const lineDelimiter =
      options?.customFormat?.customLineDelimiter ?? DEFAULT_LINE_DELIMITER;
    const nameDelimiter =
      options?.customFormat?.customNameDelimiter ?? DEFAULT_NAME_DELIMITER;

    return serialized.split(lineDelimiter).map(param => {
      const delimiterIndex = param.indexOf(roleDelimiter);
      if (delimiterIndex === -1) {
        throw new Error('Missing delimiter in input string.');
      }

      const nameDelimiterIndex = param.indexOf(nameDelimiter);

      // Check if name delimiter is present and is before role delimiter
      if (nameDelimiterIndex !== -1 && nameDelimiterIndex < delimiterIndex) {
        const role = param.substring(0, nameDelimiterIndex);
        const name = param.substring(
          nameDelimiterIndex + nameDelimiter.length,
          delimiterIndex,
        );
        const content = param.substring(delimiterIndex + roleDelimiter.length);

        if (role === '' || content === '') {
          throw new Error(
            'Role or content is missing in one of the parameters.',
          );
        }
        return { role, content, name } as ChatCompletionParameter;
      } else {
        const role = param.substring(0, delimiterIndex);
        const content = param.substring(delimiterIndex + roleDelimiter.length);

        if (role === '' || content === '') {
          throw new Error(
            'Role or content is missing in one of the parameters.',
          );
        }
        return { role, content } as ChatCompletionParameter;
      }
    });
  }
};

// Converts camelCase strings to snake_case
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Converts snake_case strings to camelCase
export function toCamelCase(str: string): string {
  return str.replace(/(_[a-z])/g, group =>
    group.toUpperCase().replace('_', ''),
  );
}

// Converts object keys to snake_case
export function keysToSnakeCase(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[toSnakeCase(key)] = value;
    return acc;
  }, {} as Record<string, unknown>);
}

// Converts object keys to camelCase
export function keysToCamelCase(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[toCamelCase(key)] = value;
    return acc;
  }, {} as Record<string, unknown>);
}

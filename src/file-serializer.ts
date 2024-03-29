import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import {
  AbstractPromptFactory,
  MessageArrayPromptFactory,
  StringPromptFactory,
} from './prompt-factory';
import {
  ChatCompletionParameter,
  MessageArrayPromptFactoryOptions,
  PromptArguments,
  PromptParser,
  StringPromptFactoryOptions,
} from './types';

export enum FileSerializationFormat {
  YAML = 'yaml',
  JSON = 'json',
}

interface SerializedPromptFactory {
  PromptFactory: string; // Assuming this is a version string
  name: string; // Assuming 'name' is a string
  promptTemplate?: string; // Assuming it returns a string representation of the template
  messagesTemplate?: ChatCompletionParameter[]; // Assuming this is an array, replace 'any' with more specific type if known
  promptArguments: PromptArguments; // A flexible object for arguments; replace 'any' with more specific types if known
  parser: PromptParser; // Assuming 'parser' is a function, consider replacing 'Function' with a more specific function type
}

/**
 * Serializes and saves a PromptFactory instance to a file in JSON or YAML format.
 *
 * @param {string} filePath - The file path to save the prompt to.
 * @param {AbstractPromptFactory} promptFactory - The PromptFactory instance to serialize.
 * @param {'json' | 'yaml'} format - The format to serialize the prompt (JSON or YAML).
 */
export async function savePromptToFile(
  filePath: string,
  promptFactory: MessageArrayPromptFactory | StringPromptFactory,
  format: FileSerializationFormat = FileSerializationFormat.JSON,
): Promise<void> {
  if (promptFactory.promptArguments === undefined) {
    throw new Error('PromptFactory: promptArguments is not set');
  }
  const objToSave: SerializedPromptFactory = {
    PromptFactory: '1',
    name: promptFactory.name,
    promptTemplate: promptFactory._getPromptTemplate(),
    messagesTemplate: promptFactory._getMessagesTemplate(),
    promptArguments: promptFactory.promptArguments,
    parser: promptFactory.parser,
  };

  let serializedData;
  if (format === FileSerializationFormat.JSON) {
    serializedData = JSON.stringify(objToSave, null, 2);
  } else if (format === FileSerializationFormat.YAML) {
    serializedData = yaml.dump(objToSave);
  } else {
    throw new Error('Unsupported format. Please use "json" or "yaml".');
  }

  await fs.writeFile(filePath, serializedData);
}

/**
 * Loads a PromptFactory instance from a file in JSON or YAML format.
 *
 * @param {string} filePath - The file path to load the prompt from.
 * @param {'json' | 'yaml'} format - The format of the file content (JSON or YAML).
 * @returns {Promise<AbstractPromptFactory>} - The deserialized PromptFactory instance.
 */
export async function loadPromptFromFile(
  filePath: string,
  format: FileSerializationFormat = FileSerializationFormat.JSON,
): Promise<MessageArrayPromptFactory | StringPromptFactory> {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  let obj;

  if (format === FileSerializationFormat.JSON) {
    try {
      obj = JSON.parse(fileContent);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `PromptFactory: Failed to parse JSON: ${error.message}`,
        );
      }
      throw new Error('PromptFactory: Failed to parse JSON.');
    }
  } else if (format === FileSerializationFormat.YAML) {
    try {
      obj = yaml.load(fileContent) as unknown;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `PromptFactory: Failed to parse YAML: ${error.message}`,
        );
      }
      throw new Error('PromptFactory: Failed to parse YAML.');
    }
  } else {
    throw new Error(
      'PromptFactory: Unsupported format. Please use "json" or "yaml".',
    );
  }

  // Check if the loaded object has the required properties
  // and cast it to the correct type
  if (
    typeof obj !== 'object' ||
    !('name' in obj) ||
    (!('promptTemplate' in obj) && !('messagesTemplate' in obj)) ||
    !('promptArguments' in obj) ||
    !('parser' in obj)
  ) {
    throw new Error('PromptFactory: Invalid file content.');
  }

  if ('messagesTemplate' in obj) {
    return new MessageArrayPromptFactory(
      obj.name,
      obj as MessageArrayPromptFactoryOptions,
    );
  }

  if ('promptTemplate' in obj) {
    return new StringPromptFactory(obj.name, obj as StringPromptFactoryOptions);
  }

  // This should never be reached
  throw new Error(
    'PromptFactory: Could not find a prompt template or a messages template.',
  );
}

import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import { PromptFactory } from './prompt-factory';

export enum FileSerializationFormat {
  YAML = 'yaml',
  JSON = 'json',
}

/**
 * Serializes and saves a PromptFactory instance to a file in JSON or YAML format.
 *
 * @param {string} filePath - The file path to save the prompt to.
 * @param {PromptFactory} promptFactory - The PromptFactory instance to serialize.
 * @param {'json' | 'yaml'} format - The format to serialize the prompt (JSON or YAML).
 */
export async function savePromptToFile(
  filePath: string,
  promptFactory: PromptFactory,
  format: FileSerializationFormat,
): Promise<void> {
  const objToSave = {
    PromptFactory: 'Version 0.0.1',
    name: promptFactory.name,
    promptTemplate: promptFactory.promptTemplate,
    messagesTemplate: promptFactory.messagesTemplate,
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
 * @returns {Promise<PromptFactory>} - The deserialized PromptFactory instance.
 */
export async function loadPromptFromFile(
  filePath: string,
  format: FileSerializationFormat,
): Promise<PromptFactory> {
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
      obj = yaml.load(fileContent);
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

  const promptFactory = new PromptFactory(obj.name, {
    promptTemplate: obj.promptTemplate,
    messagesTemplate: obj.messagesTemplate,
    promptArguments: obj.promptArguments,
    parser: obj.parser,
  });

  return promptFactory;
}

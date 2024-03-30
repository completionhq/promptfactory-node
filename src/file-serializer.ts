import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import { MessageArrayPrompt, StringPrompt } from './prompt-factory';
import {
  MessageArrayPromptFactoryOptions,
  StringPromptFactoryOptions,
} from './types';
import { keysToCamelCase, keysToSnakeCase } from './utils';

export enum FileSerializationFormat {
  YAML = 'yaml',
  JSON = 'json',
}
export async function savePromptToFile(
  filePath: string,
  promptFactory: MessageArrayPrompt | StringPrompt,
  format: FileSerializationFormat = FileSerializationFormat.JSON,
): Promise<void> {
  if (promptFactory.promptArguments === undefined) {
    throw new Error('PromptFactory: promptArguments is not set');
  }

  const objToSave = keysToSnakeCase({
    PromptFactory: '1',
    name: promptFactory.name,
    template: promptFactory._getRawTemplate(),
    promptArguments: promptFactory.promptArguments,
    parser: promptFactory.parser,
  });

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

export async function loadPromptFromFile(
  filePath: string,
  format: FileSerializationFormat = FileSerializationFormat.JSON,
): Promise<MessageArrayPrompt | StringPrompt> {
  const fileContent = await fs.readFile(filePath, 'utf-8');
  let obj;

  if (format === FileSerializationFormat.JSON) {
    obj = JSON.parse(fileContent);
  } else if (format === FileSerializationFormat.YAML) {
    obj = yaml.load(fileContent) as unknown;
  } else {
    throw new Error(
      'PromptFactory: Unsupported format. Please use "json" or "yaml".',
    );
  }

  obj = keysToCamelCase(obj);

  if (
    typeof obj !== 'object' ||
    !('name' in obj) ||
    !('template' in obj) ||
    !('promptArguments' in obj) ||
    !('parser' in obj)
  ) {
    throw new Error('PromptFactory: Invalid file content.');
  }

  if ('template' in obj && typeof obj.template === 'string') {
    return new StringPrompt(
      obj.name as string,
      (obj as unknown) as StringPromptFactoryOptions,
    );
  }

  if ('promptTemplate' in obj) {
    return new MessageArrayPrompt(
      obj.name as string,
      (obj as unknown) as MessageArrayPromptFactoryOptions,
    );
  }

  throw new Error(
    'PromptFactory: Could not find a prompt template or a messages template.',
  );
}

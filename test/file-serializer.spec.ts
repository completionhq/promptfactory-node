import { expect } from 'chai';
import { PathLike } from 'fs';
import * as fs from 'fs/promises';
import {
  FileSerializationFormat,
  loadPromptFromFile,
  savePromptToFile,
} from '../src/file-serializer';
import {
  AbstractPromptFactory,
  StringPromptFactory,
} from '../src/prompt-factory';
import { PromptParser } from '../src/types';

// Mock data for testing
const testPromptFactory = new StringPromptFactory('TestFactory', {
  promptTemplate: '{arg1} {arg2}',
  promptArguments: {
    arg1: 'arg1',
    arg2: 'arg2',
  },
  parser: PromptParser.FString,
});

const testFilePathJson = 'testPromptFactory.json';
const testFilePathYaml = 'testPromptFactory.yaml';

// Helper function to delete test files
const cleanUp = async (filePath: PathLike) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // Ignore error if file does not exist
  }
};

describe('FileSerializer', function() {
  describe('savePromptToFile', function() {
    afterEach(async function() {
      // Cleanup files after each test
      await cleanUp(testFilePathJson);
      await cleanUp(testFilePathYaml);
    });

    it('should save a PromptFactory instance to a JSON file', async function() {
      await savePromptToFile(
        testFilePathJson,
        testPromptFactory,
        FileSerializationFormat.JSON,
      );
      const fileExists = await fs
        .access(testFilePathJson)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).to.be.true;
    });

    it('should save a PromptFactory instance to a YAML file', async function() {
      await savePromptToFile(
        testFilePathYaml,
        testPromptFactory,
        FileSerializationFormat.YAML,
      );
      const fileExists = await fs
        .access(testFilePathYaml)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).to.be.true;
    });
  });

  describe('loadPromptFromFile', function() {
    before(async function() {
      // Prepare test files
      await savePromptToFile(
        testFilePathJson,
        testPromptFactory,
        FileSerializationFormat.JSON,
      );
      await savePromptToFile(
        testFilePathYaml,
        testPromptFactory,
        FileSerializationFormat.YAML,
      );
    });

    after(async function() {
      // Cleanup files after all tests
      await cleanUp(testFilePathJson);
      await cleanUp(testFilePathYaml);
    });

    it('should load a PromptFactory instance from a JSON file', async function() {
      const loadedPromptFactory = await loadPromptFromFile(
        testFilePathJson,
        FileSerializationFormat.JSON,
      );
      expect(loadedPromptFactory).to.be.an.instanceof(AbstractPromptFactory);
      expect(loadedPromptFactory.name).to.equal(testPromptFactory.name);
    });

    it('should load a PromptFactory instance from a YAML file', async function() {
      const loadedPromptFactory = await loadPromptFromFile(
        testFilePathYaml,
        FileSerializationFormat.YAML,
      );
      expect(loadedPromptFactory).to.be.an.instanceof(AbstractPromptFactory);
      expect(loadedPromptFactory.name).to.equal(testPromptFactory.name);
    });
  });
});

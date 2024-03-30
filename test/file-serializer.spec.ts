import { expect } from 'chai';
import { PathLike } from 'fs';
import * as fs from 'fs/promises';
import {
  FileSerializationFormat,
  loadPromptFromFile,
  savePromptToFile,
} from '../src/file-serializer';
import { StringPrompt } from '../src/prompt-factory';
import { PromptParser } from '../src/types';
import sinon = require('sinon');

// Mock data for testing
const testStringPromptFactory = new StringPrompt('TestFactory', {
  template: '{arg1} {arg2}',
  promptArguments: {
    arg1: 'arg1',
    arg2: 'arg2',
  },
  parser: PromptParser.FString,
});

const testFilePathJson = 'testStringPromptFactory.json';
const testFilePathYaml = 'testStringPromptFactory.yaml';

// Helper function to delete test files
const cleanUp = async (filePath: PathLike) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // Ignore error if file does not exist
  }
};

describe('FileSerializer', function() {
  let readStub, writeStub;

  before(function() {
    // Stub the fs.readFile and fs.writeFile methods
    readStub = sinon.stub(fs, 'readFile');
    writeStub = sinon.stub(fs, 'writeFile');

    // Setup the stub for readFile to mimic reading JSON and YAML files
    readStub.withArgs(testFilePathJson).resolves(
      JSON.stringify({
        name: 'TestFactory',
        template: '{arg1} {arg2}',
        prompt_arguments: {
          arg1: 'arg1',
          arg2: 'arg2',
        },
        parser: 'f-string',
      }),
    );
    readStub.withArgs(testFilePathYaml).resolves(`
      name: TestFactory
      template: '{arg1} {arg2}'
      prompt_arguments:
        arg1: arg1
        arg2: arg2
      parser: FString
    `);

    // The writeFile stub doesn't need to resolve to any specific value
    writeStub.resolves();
  });
  afterEach(async function() {
    // Cleanup files after each test
    await cleanUp(testFilePathJson);
    await cleanUp(testFilePathYaml);
  });

  before(async function() {
    // Prepare test files
    await savePromptToFile(
      testFilePathJson,
      testStringPromptFactory,
      FileSerializationFormat.JSON,
    );
    await savePromptToFile(
      testFilePathYaml,
      testStringPromptFactory,
      FileSerializationFormat.YAML,
    );
  });

  after(async function() {
    // Cleanup files after all tests
    await cleanUp(testFilePathJson);
    await cleanUp(testFilePathYaml);
  });

  describe('loadPromptFromFile', function() {
    it('should load a StringPrompt instance from a JSON file with camelCase properties', async function() {
      const loadedPromptFactory = await loadPromptFromFile(
        testFilePathJson,
        FileSerializationFormat.JSON,
      );
      expect(loadedPromptFactory).to.be.an.instanceof(StringPrompt);
      expect(loadedPromptFactory.name).to.equal(testStringPromptFactory.name);
      // Ensure properties are in camelCase as expected
      expect(loadedPromptFactory).to.have.property('promptArguments');
      expect(loadedPromptFactory.promptArguments).to.deep.equal({
        arg1: 'arg1',
        arg2: 'arg2',
      });
    });

    it('should load a StringPrompt instance from a YAML file with camelCase properties', async function() {
      const loadedPromptFactory = await loadPromptFromFile(
        testFilePathYaml,
        FileSerializationFormat.YAML,
      );
      expect(loadedPromptFactory).to.be.an.instanceof(StringPrompt);
      expect(loadedPromptFactory.name).to.equal(testStringPromptFactory.name);
      // Ensure properties are in camelCase as expected
      expect(loadedPromptFactory).to.have.property('promptArguments');
      expect(loadedPromptFactory.promptArguments).to.deep.equal({
        arg1: 'arg1',
        arg2: 'arg2',
      });
    });

    // Save the file
    it('should save a StringPrompt instance to a JSON file', async function() {
      await savePromptToFile(
        testFilePathJson,
        testStringPromptFactory,
        FileSerializationFormat.JSON,
      );
      const loadedPromptFactory = await loadPromptFromFile(
        testFilePathJson,
        FileSerializationFormat.JSON,
      );
      expect(loadedPromptFactory).to.be.an.instanceof(StringPrompt);
      expect(loadedPromptFactory.name).to.equal(testStringPromptFactory.name);
      expect(loadedPromptFactory.promptArguments).to.deep.equal({
        arg1: 'arg1',
        arg2: 'arg2',
      });
    });

    it('should save a StringPrompt instance to a YAML file', async function() {
      await savePromptToFile(
        testFilePathYaml,
        testStringPromptFactory,
        FileSerializationFormat.YAML,
      );

      const loadedPromptFactory = await loadPromptFromFile(
        testFilePathYaml,
        FileSerializationFormat.YAML,
      );
      expect(loadedPromptFactory).to.be.an.instanceof(StringPrompt);
      expect(loadedPromptFactory.name).to.equal(testStringPromptFactory.name);
      expect(loadedPromptFactory.promptArguments).to.deep.equal({
        arg1: 'arg1',
        arg2: 'arg2',
      });
    });

    // Check that the file is saved as snake case
    it('should save a StringPrompt instance to a JSON file with snake_case properties', async function() {
      await savePromptToFile(
        testFilePathJson,
        testStringPromptFactory,
        FileSerializationFormat.JSON,
      );
      const fileContent = await fs.readFile(testFilePathJson, 'utf-8');
      const obj = JSON.parse(fileContent);
      expect(obj).to.have.property('prompt_arguments');
    });
  });
});

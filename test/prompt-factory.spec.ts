import { expect } from 'chai';
import { FileSerializationFormat } from '../src/file-serializer';
import { PromptFactory } from '../src/prompt-factory';
import { PromptParser } from '../src/types';

describe('PromptFactory', function() {
  describe('constructor and initialization', function() {
    it('should initialize with default values if no options are provided', function() {
      const factory = new PromptFactory('test');
      expect(factory.name).to.equal('test');
      expect(factory.parser).to.equal(PromptParser.FString);
      expect(factory.fileSerializationFormat).to.equal(
        FileSerializationFormat.YAML,
      );
    });

    it('should throw an error for unsupported file serialization format', async function() {
      // Assuming there's logic to handle unsupported file formats
      // You'd need to mock `loadPromptFromFile` to test this properly
    });
  });

  describe('setPromptTemplate', function() {
    it('should set prompt template correctly', function() {
      const factory = new PromptFactory('test');
      factory.setPromptTemplate('Hello, {name}!');
      expect(factory.promptTemplate).to.equal('Hello, {name}!');
    });

    it('should throw error if prompt arguments are invalid', function() {
      const factory = new PromptFactory('test');
      factory.promptArguments = { missingKey: true }; // Assuming this is invalid for our template
      expect(() => factory.setPromptTemplate('Hello, {name}!')).to.throw();
    });
  });

  describe('hydratePromptTemplate', function() {
    it('should correctly hydrate the prompt template', function() {
      const factory = new PromptFactory('test', {
        promptTemplate: 'Hello, {name}!',
        promptArguments: { name: 'John Doe' },
      });
      const hydratedTemplate = factory.getHydratedPromptString();
      expect(hydratedTemplate).to.equal('Hello, John Doe!');
    });

    it('should throw error if prompt arguments are not set', function() {
      const factory = new PromptFactory('test');
      expect(() => factory.getHydratedPromptString()).to.throw(
        'Prompt arguments are not set',
      );
    });
    it('should throw error if prompt template is not set', function() {
      const factory = new PromptFactory('test', {
        promptArguments: { name: 'John Doe' },
      });
      expect(() => factory.getHydratedPromptString()).to.throw(
        'The prompt or messages template is not set',
      );
    });
  });

  // Add more tests covering different methods and error conditions...
});

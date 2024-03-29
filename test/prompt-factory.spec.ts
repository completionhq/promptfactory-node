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
  });

  describe('setMessagesTemplate', function() {
    it('should set messages template correctly', function() {
      const factory = new PromptFactory('test');
      const messagesTemplate = [
        { role: 'user', content: 'Hello, {name}!' } as const,
      ];
      factory.setMessagesTemplate(messagesTemplate);
      expect(factory.messagesTemplate).to.deep.equal(messagesTemplate);
    });
  });

  describe('getHydratedPromptString', function() {
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
        'Prompt template is not set',
      );
    });
    it('should throw error if prompt template is not set', function() {
      const factory = new PromptFactory('test', {
        promptArguments: { name: 'John Doe' },
      });
      expect(() => factory.getHydratedPromptString()).to.throw(
        'Prompt template is not set',
      );
    });
  });

  describe('getHydratedMessagesArray', function() {
    it('should correctly hydrate the messages template', function() {
      const factory = new PromptFactory('test', {
        messagesTemplate: [{ role: 'user', content: 'Hello, {name}!' }],
        promptArguments: { name: 'John Doe' },
      });
      const hydratedMessagesArray = factory.getHydratedMessagesArray();
      expect(hydratedMessagesArray).to.deep.equal([
        { role: 'user', content: 'Hello, John Doe!' },
      ]);
    });

    it('should throw error if messages template is not set', function() {
      const factory = new PromptFactory('test');
      expect(() => factory.getHydratedMessagesArray()).to.throw(
        'Messages template is not set',
      );
    });

    it('should throw error if prompt args are not set for messages', function() {
      const factory = new PromptFactory('test', {
        messagesTemplate: [{ role: 'user', content: 'Hello, {name}!' }],
      });
      expect(() => factory.getHydratedMessagesArray()).to.throw();
    });
  });
  describe('getHydratedMessagesArrayAsString', function() {
    let factory: PromptFactory;

    beforeEach(() => {
      // Setup common to all tests in this describe block
      factory = new PromptFactory('test');
      const messagesTemplate = [
        { role: 'user', content: 'Hello, {name}!' } as const,
        {
          role: 'assistant',
          content: 'Hi, {name}, how can I assist you today?',
        } as const,
      ];
      factory.setMessagesTemplate(messagesTemplate);
    });

    it('should correctly serialize and hydrate the messages template into a string', function() {
      factory.setPromptArguments({ name: 'John Doe' });
      const expectedString =
        'user: Hello, John Doe!\nassistant: Hi, John Doe, how can I assist you today?';
      const resultString = factory.getHydratedMessagesArrayAsString();
      expect(resultString).to.equal(expectedString);
    });

    it('should throw an error if messages template is not set', function() {
      factory = new PromptFactory('test'); // Reset without setting a messages template
      expect(() => factory.getHydratedMessagesArrayAsString()).to.throw(
        'Messages template is not set',
      );
    });

    it('should throw an error if prompt arguments are not set', function() {
      // Arguments not set here
      expect(() => factory.getHydratedMessagesArrayAsString()).to.throw();
    });

    it('should handle empty messages template gracefully', function() {
      factory.setMessagesTemplate([]);
      factory.setPromptArguments({});
      const expectedString = ''; // Expecting an empty string for an empty template
      const resultString = factory.getHydratedMessagesArrayAsString();
      expect(resultString).to.equal(expectedString);
    });

    it('should correctly handle messages with special characters in arguments', function() {
      factory = new PromptFactory('test');
      factory.setPromptArguments({ name: 'John Doe', specialChar: '<>&"\'`' });
      const messagesTemplateWithSpecialChars = [
        {
          role: 'user',
          content: 'Hi! {name} has special characters: {specialChar}',
        } as const,
      ];
      factory.setMessagesTemplate(messagesTemplateWithSpecialChars);
      const expectedString = `user: Hi! John Doe has special characters: <>&"'\``;
      const resultString = factory.getHydratedMessagesArrayAsString();
      expect(resultString).to.equal(expectedString);
    });

    it('should serialize messages with multiple roles correctly', function() {
      factory = new PromptFactory('test');
      const multiRoleTemplate = [
        { role: 'user', content: 'User message' } as const,
        { role: 'assistant', content: 'Assistant response' } as const,
        { role: 'system', content: 'System notification' } as const,
      ];
      factory.setMessagesTemplate(multiRoleTemplate);
      const expectedString =
        'user: User message\nassistant: Assistant response\nsystem: System notification';
      const resultString = factory.getHydratedMessagesArrayAsString();
      expect(resultString).to.equal(expectedString);
    });
  });
});

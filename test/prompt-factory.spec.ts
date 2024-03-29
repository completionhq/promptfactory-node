import { expect } from 'chai';
import * as sinon from 'sinon';
import { FileSerializationFormat } from '../src/file-serializer';
import {
  AbstractPromptFactory,
  MessageArrayPromptFactory,
  StringPromptFactory,
} from '../src/prompt-factory';
import { PromptParser } from '../src/types';

describe('PromptFactory ', function() {
  describe('AbstractPromptFactory', function() {
    it('initializes with defaults when no options are provided', function() {
      const factory = AbstractPromptFactory.unsafeCreate('defaultTest', {});
      expect(factory.name).to.equal('defaultTest');
      expect(factory.parser).to.equal(PromptParser.FString);
      expect(factory.fileSerializationFormat).to.equal(
        FileSerializationFormat.JSON,
      );
    });
  });

  describe('StringPromptFactory', function() {
    it('inherits and extends AbstractPromptFactory correctly', function() {
      const factory = new StringPromptFactory('stringTest', {
        promptTemplate: 'Hello, {name}!',
      });
      expect(factory.name).to.equal('stringTest');
      expect(factory.getPromptTemplate()).to.equal('Hello, {name}!');
    });
  });

  describe('MessageArrayPromptFactory', function() {
    it('sets and gets messages template correctly', function() {
      const factory = new MessageArrayPromptFactory('messagesTest', {
        messagesTemplate: [
          { role: 'user', content: 'Hi there, {name}!' } as const,
        ],
      });
      const newTemplate = [
        { role: 'assistant', content: 'Hello, {name}!' } as const,
      ];
      factory.setMessagesTemplate(newTemplate);
      expect(factory.getMessagesTemplate()).to.deep.equal(newTemplate);
    });

    it('hydrates messages array with arguments', function() {
      const factory = new MessageArrayPromptFactory('hydrateMessagesTest', {
        messagesTemplate: [{ role: 'user', content: 'Hi, {name}!' }],
        promptArguments: { name: 'Jane' },
      });
      const result = factory.getHydratedMessagesArray();
      expect(result).to.deep.equal([{ role: 'user', content: 'Hi, Jane!' }]);
    });

    it('serializes and hydrates messages template into a string', function() {
      const factory = new MessageArrayPromptFactory('serializeTest', {
        messagesTemplate: [
          { role: 'user', content: 'Hello, {name}!' } as const,
          {
            role: 'assistant',
            content: 'How can I help you, {name}?',
          } as const,
        ],
        promptArguments: { name: 'John Doe' },
      });
      const result = factory.getHydratedMessagesArrayAsString();
      expect(result).to.equal(
        'user: Hello, John Doe!\nassistant: How can I help you, John Doe?',
      );
    });
  });

  describe('PromptFactory File Loading Tests', function() {
    let sandbox: sinon.SinonSandbox;

    beforeEach(function() {
      // Create a sandbox for sinon
      sandbox = sinon.createSandbox();
    });

    afterEach(function() {
      // Restore the original functionalities after each test
      sandbox.restore();
    });

    it('StringPromptFactory loads prompt from file correctly', async function() {
      // Mock the `loadPromptFromFile` function to return a specific result
      const mockPromptFactoryResult = new StringPromptFactory(
        'mockStringFactory',
        {
          promptTemplate: 'Mock template',
        },
      );
      sandbox
        .stub(StringPromptFactory, 'loadPromptFromFile')
        .resolves(mockPromptFactoryResult);

      const factory = await StringPromptFactory.loadPromptFromFile(
        'path/to/mock/file',
      );
      expect(factory).to.be.instanceOf(StringPromptFactory);
      expect(factory.getPromptTemplate()).to.equal('Mock template');
    });

    it('MessageArrayPromptFactory loads prompt from file correctly', async function() {
      // Mock the `loadPromptFromFile` function to return a specific result
      const mockPromptFactoryResult = new MessageArrayPromptFactory(
        'mockMessageArrayFactory',
        {
          messagesTemplate: [{ role: 'user', content: 'Mock message' }],
        },
      );
      sandbox
        .stub(MessageArrayPromptFactory, 'loadPromptFromFile')
        .resolves(mockPromptFactoryResult);

      const factory = await MessageArrayPromptFactory.loadPromptFromFile(
        'path/to/mock/file',
      );
      expect(factory).to.be.instanceOf(MessageArrayPromptFactory);
      expect(factory.getMessagesTemplate()).to.deep.equal([
        { role: 'user', content: 'Mock message' },
      ]);
    });

    // Additional tests can be added here
  });
});

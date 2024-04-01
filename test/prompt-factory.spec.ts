import { expect } from 'chai';
import * as sinon from 'sinon';
import { FileSerializationFormat } from '../src/file-serializer';
import {
  AbstractPrompt,
  MessageArrayPrompt,
  StringPrompt,
} from '../src/prompt-factory';
import { PromptParser } from '../src/types';

describe('PromptFactory ', function() {
  describe('AbstractPromptFactory', function() {
    it('initializes with defaults when no options are provided', function() {
      const factory = AbstractPrompt._unsafeCreate('defaultTest', {});
      expect(factory.name).to.equal('defaultTest');
      expect(factory.parser).to.equal(PromptParser.FString);
      expect(factory.fileSerializationFormat).to.equal(
        FileSerializationFormat.JSON,
      );
    });
  });

  describe('StringPromptFactory', function() {
    it('inherits and extends AbstractPromptFactory correctly', function() {
      const factory = new StringPrompt('stringTest', {
        template: 'Hello, {{{name}}}!',
        promptArguments: { name: 'John' },
      });
      expect(factory.name).to.equal('stringTest');
      expect(factory.hydrate()).to.equal('Hello, {John}!');
    });
  });

  describe('MessageArrayPromptFactory', function() {
    it('sets and gets messages template correctly', function() {
      const factory = new MessageArrayPrompt('messagesTest', {
        template: [{ role: 'user', content: 'Hi there, {name}!' } as const],
      });
      const newTemplate = [
        { role: 'assistant', content: 'Hello, {name}!' } as const,
      ];
      factory.setMessagesTemplate(newTemplate);
      expect(factory.getMessagesTemplate()).to.deep.equal(newTemplate);
    });

    it('hydrates messages array with arguments', function() {
      const factory = new MessageArrayPrompt('hydrateMessagesTest', {
        template: [{ role: 'user', content: 'Hi, {name}!' }],
        promptArguments: { name: 'Jane' },
      });
      const result = factory.hydrate();
      expect(result).to.deep.equal([{ role: 'user', content: 'Hi, Jane!' }]);
    });

    // messages array with newlines
    it('hydrates messages array with newlines correctly', function() {
      const factory = new MessageArrayPrompt('hydrateMessagesTest', {
        template: [
          { role: 'user', content: 'Hi, {name}!\n' },
          { role: 'assistant', content: 'Hello, {name}!' },
        ],
        promptArguments: { name: 'Jane\n' },
      });
      const result = factory.hydrate();
      expect(result).to.deep.equal([
        { role: 'user', content: 'Hi, Jane\n!\n' },
        { role: 'assistant', content: 'Hello, Jane\n!' },
      ]);
    });

    it('serializes and hydrates messages template into a string', function() {
      const factory = new MessageArrayPrompt('serializeTest', {
        template: [
          { role: 'user', content: 'Hello, {name}!' } as const,
          {
            role: 'assistant',
            content: 'How can I help you, {name}?',
          } as const,
        ],
        promptArguments: { name: 'John Doe' },
      });
      const result = factory.hydrateAsString();
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
      const mockPromptFactoryResult = new StringPrompt('mockStringFactory', {
        template: 'Mock template',
      });
      sandbox
        .stub(StringPrompt, 'loadPromptFromFile')
        .resolves(mockPromptFactoryResult);

      const factory = await StringPrompt.loadPromptFromFile(
        'path/to/mock/file',
      );
      expect(factory).to.be.instanceOf(StringPrompt);
      expect(factory.hydrate()).to.equal('Mock template');
    });

    it('MessageArrayPromptFactory loads prompt from file correctly', async function() {
      // Mock the `loadPromptFromFile` function to return a specific result
      const mockPromptFactoryResult = new MessageArrayPrompt(
        'mockMessageArrayFactory',
        {
          template: [{ role: 'user', content: 'Mock message' }],
        },
      );
      sandbox
        .stub(MessageArrayPrompt, 'loadPromptFromFile')
        .resolves(mockPromptFactoryResult);

      const factory = await MessageArrayPrompt.loadPromptFromFile(
        'path/to/mock/file',
      );
      expect(factory).to.be.instanceOf(MessageArrayPrompt);
      expect(factory.getMessagesTemplate()).to.deep.equal([
        { role: 'user', content: 'Mock message' },
      ]);
    });

    // set prompt arguments
    it('StringPromptFactory sets prompt arguments correctly', function() {
      const factory = new StringPrompt('stringTest', {
        template: 'Hello, {{{name}}}!',
      });
      factory.setPromptArguments({ name: 'John' });
      expect(factory.promptArguments).to.deep.equal({ name: 'John' });
    });

    // upsert prompt arguments
    it('StringPromptFactory upserts prompt arguments correctly', function() {
      const factory = new StringPrompt('stringTest', {
        template: 'Hello, {{{name}}}!',
        promptArguments: { name: 'John' },
      });
      factory.upsertPromptArguments({ name: 'Jane' });
      expect(factory.promptArguments).to.deep.equal({ name: 'Jane' });
    });
  });
});

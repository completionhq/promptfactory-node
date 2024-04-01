/* eslint-disable no-unused-expressions */
import * as assert from 'assert';
import { expect } from 'chai';
import { PromptSerializationFormat } from '../src/types';
import {
  deserializeChatCompletionParameters,
  hydrateAndValidateFStringTemplate,
  serializeChatCompletionParameters,
} from '../src/utils';

describe('Utilities', () => {
  describe('validatePromptTemplateWithArguments', () => {
    it('should correctly replace variables and return the interpolated string', () => {
      const template = 'Hello, {name}! Welcome to {place}.';
      const args = { name: 'Alice', place: 'Wonderland' };
      const expected = 'Hello, Alice! Welcome to Wonderland.';
      assert.strictEqual(
        hydrateAndValidateFStringTemplate(template, args),
        expected,
      );
    });

    it('should handle escaped brackets correctly', () => {
      const template = 'This is a test of {{}} escaped brackets.';
      const expected = 'This is a test of {} escaped brackets.';
      assert.strictEqual(
        hydrateAndValidateFStringTemplate(template, {}),
        expected,
      );
    });

    // Handle double escaped brackets
    it('should handle double escaped brackets correctly', () => {
      const template = 'This is a test of {{{{}}}} escaped brackets.';
      const expected = 'This is a test of {{}} escaped brackets.';
      assert.strictEqual(
        hydrateAndValidateFStringTemplate(template, {}),
        expected,
      );
    });

    it('should handle escaped brackets with variables', () => {
      const template = "This is a test of {name}'s {{}} escaped brackets.";
      const args = { name: 'Bob' };
      const expected = "This is a test of Bob's {} escaped brackets.";
      assert.strictEqual(
        hydrateAndValidateFStringTemplate(template, args),
        expected,
      );
    });

    it('should throw an error if a variable in templateStr is not in promptArgs', () => {
      const template = 'Hello, {name}, your ID is {id}.';
      const args = { name: 'Bob' }; // Missing 'id'
      assert.throws(
        () => {
          hydrateAndValidateFStringTemplate(template, args);
        },
        Error,
        'Variable "id" is not provided in promptArgs.',
      );
    });

    it('should handle the case if promptArgs contains more variables than templateStr gracefully', () => {
      const template = 'Hello, {name}!';
      const args = { name: 'Charlie', age: 30 }; // 'age' is not used
      const expected = 'Hello, Charlie!';
      assert.strictEqual(
        hydrateAndValidateFStringTemplate(template, args),
        expected,
      );
    });

    it('should correctly process a template with no variables', () => {
      const template = 'This is a simple string.';
      const expected = 'This is a simple string.';
      assert.strictEqual(
        hydrateAndValidateFStringTemplate(template, {}),
        expected,
      );
    });

    it('should handle complex scenarios with nested and escaped brackets', () => {
      const template = "Nested {{brackets}} and {name}'s escaped {{bracket}}.";
      const args = { name: 'Developer' };
      const expected = "Nested {brackets} and Developer's escaped {bracket}.";
      assert.strictEqual(
        hydrateAndValidateFStringTemplate(template, args),
        expected,
      );
    });

    // A template with {} should throw an error if no variables are provided
    it('should throw an error if templateStr contains {} with no variables', () => {
      const template = 'This is a test of {} brackets.';
      assert.throws(
        () => {
          hydrateAndValidateFStringTemplate(template, {});
        },
        Error,
        'Variable "" is not provided in promptArgs.',
      );
    });

    // A template with an {{{}}} should throw an error if no variables are provided
    it('should throw an error if templateStr contains {{{}}} with no variables', () => {
      const template = 'This is a test of {{{}}} brackets.';
      assert.throws(
        () => {
          hydrateAndValidateFStringTemplate(template, {});
        },
        Error,
        'Variable "" is not provided in promptArgs.',
      );
    });
  });
  describe('serializeChatCompletionParameters', () => {
    // Test JSON serialization
    it('should correctly serialize messages to JSON format', () => {
      const messages = [
        { role: 'user', content: 'Hello' } as const,
        { role: 'assistant', content: 'Hi there!' } as const,
      ];
      const options = { format: PromptSerializationFormat.JSON };
      const result = serializeChatCompletionParameters(messages, options);
      expect(result).to.equal(JSON.stringify(messages));
    });

    // Test custom serialization with default delimiters
    it('should correctly serialize messages with custom format using default delimiters', () => {
      const messages = [
        { role: 'user', content: 'Hello' } as const,
        { role: 'assistant', content: 'Hi there!' } as const,
      ];
      const options = { format: PromptSerializationFormat.CUSTOM };
      const expected = 'user=>>Hello<&&pf-line&&>assistant=>>Hi there!';
      const result = serializeChatCompletionParameters(messages, options);
      expect(result).to.equal(expected);
    });

    // Test custom serialization with custom delimiters
    it('should correctly serialize messages with custom format using custom delimiters', () => {
      const messages = [
        { role: 'user', content: 'Hello' } as const,
        { role: 'assistant', content: 'Hi there!' } as const,
      ];
      const options = {
        format: PromptSerializationFormat.CUSTOM,
        customFormat: {
          customRoleDelimiter: '::',
          customLineDelimiter: '||',
          customNameDelimiter: '$$',
        },
      };
      const expected = 'user::Hello||assistant::Hi there!';
      const result = serializeChatCompletionParameters(messages, options);
      expect(result).to.equal(expected);
    });

    // Test error handling for JSON serialization
    it('should throw an error if JSON serialization fails', () => {
      const circularReference = {};
      // @ts-expect-error
      circularReference.myself = circularReference; // Creating a circular reference to force a JSON.stringify error

      expect(() =>
        serializeChatCompletionParameters(
          [{ role: 'user', content: JSON.stringify(circularReference) }],
          {
            format: PromptSerializationFormat.JSON,
          },
        ),
      ).to.throw(Error);
    });
  });

  describe('deserializeChatCompletionParameters', function() {
    // Define some defaults for testing
    const DefaultRoleDelimiter = '=>>';
    const DefaultLineDelimiter = '<&&prompt-factory&&>';
    const DefaultNameDelimiter = '$$';

    it('should correctly deserialize a JSON string', function() {
      const serialized = JSON.stringify([
        { role: 'user', content: 'hello' },
        { role: 'bot', content: 'hi there' },
      ]);
      const options = {
        format: PromptSerializationFormat.JSON,
        customRoleDelimiter: DefaultRoleDelimiter,
        customLineDelimiter: DefaultLineDelimiter,
      };
      const result = deserializeChatCompletionParameters(serialized, options);
      expect(result).to.deep.equal([
        { role: 'user', content: 'hello' },
        { role: 'bot', content: 'hi there' },
      ]);
    });

    it('should throw an error for invalid JSON string', function() {
      const serialized = 'not a valid json';
      const options = {
        format: PromptSerializationFormat.JSON,
        customRoleDelimiter: DefaultRoleDelimiter,
        customLineDelimiter: DefaultLineDelimiter,
      };
      expect(() =>
        deserializeChatCompletionParameters(serialized, options),
      ).to.throw('Failed to parse JSON');
    });

    it('should correctly deserialize a custom formatted string', function() {
      const serialized = 'user=>>hello<&&prompt-factory&&>bot=>>hi there';
      const options = {
        format: PromptSerializationFormat.CUSTOM,
        customFormat: {
          customRoleDelimiter: DefaultRoleDelimiter,
          customLineDelimiter: DefaultLineDelimiter,
          customNameDelimiter: DefaultNameDelimiter,
        },
      };
      const result = deserializeChatCompletionParameters(serialized, options);
      expect(result).to.deep.equal([
        { role: 'user', content: 'hello' },
        { role: 'bot', content: 'hi there' },
      ]);
    });

    it('should handle missing delimiter in custom format', function() {
      const serialized = 'user hello<&&prompt-factory&&>bot hi there'; // Deliberately missing the delimiter
      const options = {
        format: PromptSerializationFormat.CUSTOM,
        customRoleDelimiter: DefaultRoleDelimiter,
        customLineDelimiter: DefaultLineDelimiter,
      };
      expect(() =>
        deserializeChatCompletionParameters(serialized, options),
      ).to.throw('Missing delimiter in input string.');
    });
  });

  // Round-trip tests for serialization and deserialization
  describe('Serialization and Deserialization Integration Tests', () => {
    // Test round-trip JSON format
    it('should correctly serialize and then deserialize messages using JSON format', () => {
      const messages = [
        { role: 'user', content: 'Hello, JSON!' } as const,
        { role: 'assistant', content: 'Hi there, JSON!' } as const,
      ];
      const options = { format: PromptSerializationFormat.JSON };
      const serialized = serializeChatCompletionParameters(messages, options);
      const deserialized = deserializeChatCompletionParameters(
        serialized,
        options,
      );

      expect(deserialized).to.deep.equal(messages);
    });

    // Test round-trip custom format with default delimiters
    it('should correctly serialize and then deserialize messages using custom format with default delimiters', () => {
      const messages = [
        { role: 'user', content: 'Hello, custom!' } as const,
        { role: 'assistant', content: 'Hi there, custom!' } as const,
      ];
      const options = { format: PromptSerializationFormat.CUSTOM };
      const serialized = serializeChatCompletionParameters(messages, options);
      const deserialized = deserializeChatCompletionParameters(
        serialized,
        options,
      );

      expect(deserialized).to.deep.equal(messages);
    });

    // Test round-trip custom format with custom delimiters
    it('should correctly serialize and then deserialize messages using custom format with custom delimiters', () => {
      const messages = [
        { role: 'user', content: 'Hello, custom delimiters!' } as const,
        { role: 'assistant', content: 'Hi there, custom delimiters!' } as const,
      ];
      const options = {
        format: PromptSerializationFormat.CUSTOM,
        customRoleDelimiter: '**',
        customLineDelimiter: '##',
      };
      const serialized = serializeChatCompletionParameters(messages, options);
      const deserialized = deserializeChatCompletionParameters(
        serialized,
        options,
      );

      expect(deserialized).to.deep.equal(messages);
    });

    // Test error handling for incorrect delimiters during deserialization
    it('should throw an error if attempting to deserialize with incorrect delimiters', () => {
      const messages = [
        { role: 'user', content: 'Hello, error handling!' } as const,
        { role: 'assistant', content: 'Hi there, error handling!' } as const,
      ];
      const serializeOptions = {
        format: PromptSerializationFormat.CUSTOM,
        customFormat: {
          customRoleDelimiter: '::',
          customLineDelimiter: '||',
          customNameDelimiter: '$$',
        },
      };
      const deserializeOptions = {
        format: PromptSerializationFormat.CUSTOM,
        customFormat: {
          customRoleDelimiter: '!=', // Intentionally incorrect
          customLineDelimiter: '##', // Intentionally incorrect
          customNameDelimiter: '$$', // Intentionally incorrect
        },
      };

      const serialized = serializeChatCompletionParameters(
        messages,
        serializeOptions,
      );

      expect(() =>
        deserializeChatCompletionParameters(serialized, deserializeOptions),
      ).to.throw(Error, 'Missing delimiter in input string.');
    });

    it('should correctly handle custom name delimiters in a round-trip serialization and deserialization', function() {
      const originalMessages = [
        { role: 'user', name: 'Alice', content: 'Hello, world!' } as const,
        { role: 'assistant', name: 'Bot', content: 'Hello, Alice!' } as const,
      ];

      const options = {
        format: PromptSerializationFormat.CUSTOM,
        customNameDelimiter: '%%',
      };

      const serialized = serializeChatCompletionParameters(
        originalMessages,
        options,
      );
      const deserialized = deserializeChatCompletionParameters(
        serialized,
        options,
      );

      expect(deserialized).to.deep.equal(originalMessages);
    });

    // Uses default delimiters for serialization and deserialization
    it('should correctly handle default name delimiters in a round-trip serialization / deserialization', function() {
      const originalMessages = [
        { role: 'user', name: 'Alice', content: 'Hello, world!' } as const,
        { role: 'assistant', name: 'Bot', content: 'Hello, Alice!' } as const,
      ];

      const options = {
        format: PromptSerializationFormat.CUSTOM,
      };

      const serialized = serializeChatCompletionParameters(
        originalMessages,
        options,
      );
      const deserialized = deserializeChatCompletionParameters(
        serialized,
        options,
      );

      expect(deserialized).to.deep.equal(originalMessages);
    });

    it('should incorrectly extract role and content without name due to delimiter issues', function() {
      const originalMessages = [
        { role: 'user', name: 'Alice', content: 'Hello, world!' } as const,
      ];

      const serializationOptions = {
        format: PromptSerializationFormat.CUSTOM,
        customFormat: {
          customNameDelimiter: '%%', // Suppose this is correctly used in serialization
          customRoleDelimiter: '=>>', // Suppose this is correctly used in serialization
          customLineDelimiter: '<&&pf-line&&>', // Suppose this is correctly used in serialization
        },
      };

      const serialized = serializeChatCompletionParameters(
        originalMessages,
        serializationOptions,
      );

      // Simulating a deserialization option that incorrectly handles the custom name delimiter
      const deserializationOptions = {
        format: PromptSerializationFormat.CUSTOM,
      };

      const deserialized = deserializeChatCompletionParameters(
        serialized,
        deserializationOptions,
      );

      // The expected outcome is incorrect due to the wrong delimiter handling
      // Assuming the test is designed to show what happens when things go wrong
      const expectedOutcome = [
        { role: 'user%%Alice', content: 'Hello, world!' }, // Correct extraction, but incorrect due to delimiter missing
      ];

      expect(deserialized).to.deep.equal(expectedOutcome);
    });
  });
});

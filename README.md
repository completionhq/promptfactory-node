# PromptFactory Library

The PromptFactory library provides a robust, efficient, and language-independent solution for constructing and managing prompt templates for use with various AI models, including but not limited to LLMs (Large Language Models) and text-to-image models. It bridges the gap between complex project structures like LangChain and straightforward string templating approaches, offering a streamlined and developer-friendly toolset for prompt management.

## Key Objectives

- **Efficiency and Simplicity:** Offer a rapid and straightforward interface for prompt management within software projects, without the need for extensive dependencies.
- **Model Compatibility:** Ensure compatibility with a wide range of AI models, including OpenAI, Mistral, Llama, etc., facilitating easy integration and flexibility in usage.
- **Developer-Focused:** Design with a focus on developer needs, allowing for prompt customization, argument validation, and easy storage and versioning of prompt templates within code repositories.

## Features

- **Ease of Use:** Intuitive API for prompt creation and management, supporting both simple and complex prompt configurations.
- **Argument Validation:** Built-in support for validating and hydrating prompt arguments, ensuring dynamic prompts are generated accurately.
- **Model Agnostic:** Works seamlessly with any AI model accepting text or structured message prompts.
- **Versatile Prompt Management:** Allows for the storage of prompt templates and arguments in code, simplifying version control and collaboration.

## Installation

Install the PromptFactory library using npm or yarn:

```bash
npm install promptfactory-node

# or

yarn add promptfactory-node
```

## Usage

Below are examples demonstrating how to use PromptFactory for creating and utilizing prompts.

### Basic Prompt Creation

```javascript
// Import required classes and types
import { StringPrompt, MessageArrayPrompt } from 'promptfactory-node'; // Assuming the classes are exported from 'promptClasses.js'

// Create a StringPrompt instance
const stringPrompt = new StringPrompt("ExamplePrompt", {
  template: "Hello, {{name}}! How can I assist you today?",
  promptArguments: { name: "John Doe" },
});

// Or set the template and arguments separately
stringPrompt.setTemplate("Hello, {{name}}! How can I assist you today?");
stringPrompt.setArguments({ name: "John Doe" });

// Hydrate the string template to produce the final prompt
const hydratedStringPrompt = stringPrompt.hydrate();
console.log(hydratedStringPrompt); // Output: Hello, John Doe! How can I assist you today?

```

### Basic Message Array Prompt Creation (OpenAI / Chat Completion format)

```javascript
// Create a MessageArrayPrompt instance
const messageArrayPrompt = new MessageArrayPrompt("ExamplePrompt", {
  template: [
    {
      role: "system",
      content: "Hello, {{name}}! How can I assist you today?",
    }
  ],
  promptArguments: { name: "John Doe" },
});

// Or set the template and arguments separately
messageArrayPrompt.setTemplate([
  {
    role: "system",
    content: "Hello, {{name}}! How can I assist you today?",
  }
]);
messageArrayPrompt.setArguments({ name: "John Doe" });

// Hydrate the message array template to produce the final array of messages
const hydratedMessages = messageArrayPrompt.hydrate();
console.log(hydratedMessages); // Output: [{ role: 'system', content: 'Hello, John Doe! How can I assist you today?' }]

// For serialization and deserialization, refer to the utilities provided in the new interfaces
```

### Integration with OpenAI

```javascript
import { OpenAI } from 'openai-node';

const prompt = new MessageArrayPromptFactory("OpenAIPrompt", {
  messagesTemplate: [
    { role: "system", content: "Hello, {{name}}! How can I assist you today?" }
  ],
  promptArguments: { name: "John Doe" },
});

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});
const result = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: prompt.getHydratedMessagesArray(),
});

console.log(result.choices[0].message.content);
```

### Configuration Options

Customize the behavior of PromptFactory with various configuration options:

- **`promptTemplate`**: String template for generating simple text prompts.
- **`messagesTemplate`**: Array of chat completion parameters for creating structured message prompts.
- **`promptArguments`**: Object containing variables to be interpolated into the prompt or messages template.
- **`parser`**: Specifies the template parser to use, defaulting to `FString` for simple string interpolation.
- **`fileSerializationFormat`**: Determines the format used for loading and saving prompts from/to files, with JSON as the default format.

## Advanced Features

- **File-based Prompt Management**: Load and manage prompts directly from files, supporting both JSON and YAML formats for ease of use and version control.
- **Dynamic Argument Hydration**: Seamlessly interpolate dynamic variables into prompts, ensuring accurate and contextually relevant prompt generation.
- **Comprehensive Validation**: Utilize built-in validation mechanisms to ensure prompt templates and arguments are correctly formatted and error-free.
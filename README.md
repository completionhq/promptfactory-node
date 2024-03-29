# PromptFactory

We built PromptFactory to create a fast, simple, and language-agnostic interface for managing prompts in code (tailored for LLMs and text-to-image models). We wanted something between a project like LangChain and a simple string template. PromptFactory is a minimalistic library that allows you to create prompts with ease, validate arguments, and generate hydrated templates for your prompts.

## Goals

- Fast, simple, and language-agnostic interface for managing prompts in code.
- Minimal dependencies.
- Model agnostic (works with any model that accepts text or messages prompts): OpenAI, Mistral, Llama, etc.
- Tailored to work with LLMs and text-to-image models.

## Features

- Create prompts with ease.
- Support argument validation.
- Focused on developers and teams that want to save their prompts in code and version control.
- Easily generate hydrated templates for your prompts.


## Installation

```bash
npm install promptfactory-node

# or

yarn add promptfactory-node

```

## Usage

```javascript

const { PromptFactory } = require('promptfactory-node');

const promptFactory = new PromptFactory();
 
// Define a prompt

const myPrompt = new PromptFactory("ExamplePrompt", {
  promptTemplate: "Hello, {{name}}! How can I assist you today?",
  promptArguments: { name: "John Doe" },
});

const prompt = myPrompt.getHydratedPromptString();
console.log(prompt); // Output: Hello, John Doe! How can I assist you today?

// Or use messages

const myPrompt = new PromptFactory("ExamplePrompt", {
  messagesTemplate: [
    {
      role: "system",
      content: "Hello, {{name}}! How can I assist you today?",
    },
  ],
  promptArguments: { name: "John Doe" },
});

const messages = myPrompt.getHydratedMessagesArray();
console.log(messages); // Output: [{ role: 'system', content: 'Hello, John Doe! How can I assist you today?' }]

```

### Example with OpenAI

```javascript
async function fetchCompletion(prompt) {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    max_tokens: 50,
  });
  return response.data.choices[0].text.trim();
}

const responseText = await fetchCompletion(dynamicPrompt);
console.log(responseText);

```

### Configuration

PromptFactory can be configured with several options to tailor its behavior to your needs. Here are some of the key configuration options:

`promptTemplate`: A string template for generating prompts (cannot be used with `messagesTemplate`).

`messagesTemplate`: An array of chat completion parameters for more complex prompt structures (cannot be used with `promptTemplate`).

`promptArguments`: An object containing arguments to be replaced in the prompt template.

`parser`: The parser to use for hydrating templates. Default is `FString`.

`fileSerializationFormat`: The format to use when loading/saving prompt templates from/to files. Default is YAML.
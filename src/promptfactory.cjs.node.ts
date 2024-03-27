// Import PromptFactory using require
const PromptFactory = require('./prompt-factory');

// Export PromptFactory both as a named export and as the default export
module.exports.PromptFactory = PromptFactory;
module.exports.default = PromptFactory;

// Export all from the specified modules. In CommonJS, you typically require each module and then explicitly re-export each named export. Since CommonJS doesn't support wildcard re-exports directly, you might need to individually export each named export or find a workaround if you have many exports.

// Assuming you have a finite set of named exports in each of these modules, you could do something like this:

// For ./types
const types = require('./types');
Object.assign(module.exports, types);

// For ./utils
const utils = require('./utils');
Object.assign(module.exports, utils);

// For ./file-serializer
const fileSerializer = require('./file-serializer');
Object.assign(module.exports, fileSerializer);

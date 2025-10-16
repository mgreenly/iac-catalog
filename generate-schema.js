#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('template', {
    describe: 'Path to the EJS template file',
    type: 'string',
    demandOption: true,
  })
  .option('output', {
    describe: 'Path to the output JSON file',
    type: 'string',
    demandOption: false,
  })
  .help()
  .argv;

/**
 * Parse EJS template and extract variable references
 * Looks for patterns like <%= metadata.name %> or <%= input.bucketName %>
 */
function extractVariables(templateContent) {
  // Regex to match <%= ... %> patterns
  const ejsRegex = /<%=\s*([^%]+?)\s*%>/g;
  const variables = new Set();

  let match;
  while ((match = ejsRegex.exec(templateContent)) !== null) {
    const expression = match[1].trim();

    // Skip function calls and complex expressions
    // Only process simple property access patterns
    if (expression.includes('(') || expression.includes('new ')) {
      continue;
    }

    // Extract the variable path (e.g., "metadata.author")
    // Remove any string operations or method calls
    const variablePath = expression.split('.').filter(part => {
      // Only keep parts that look like property names
      return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(part.trim());
    }).join('.');

    if (variablePath && variablePath.includes('.')) {
      variables.add(variablePath);
    }
  }

  return Array.from(variables);
}

/**
 * Build JSON Schema structure from variable paths
 * Example: "metadata.author" becomes a proper JSON Schema with required fields
 */
function buildJsonSchema(variables) {
  const schema = {
    type: 'object',
    properties: {},
    required: []
  };

  // Group variables by their top-level namespace
  const namespaces = {};

  variables.forEach(variablePath => {
    const parts = variablePath.split('.');
    const topLevel = parts[0];

    if (!namespaces[topLevel]) {
      namespaces[topLevel] = [];
    }
    namespaces[topLevel].push(parts.slice(1));
  });

  // Build schema for each namespace
  Object.keys(namespaces).forEach(namespace => {
    const fields = namespaces[namespace];

    // Create properties object for this namespace
    const properties = {};
    const required = [];

    fields.forEach(fieldParts => {
      if (fieldParts.length === 1) {
        // Simple field
        const fieldName = fieldParts[0];
        properties[fieldName] = {
          type: 'string',
          title: fieldName
        };
        required.push(fieldName);
      } else if (fieldParts.length > 1) {
        // Nested field - for now treat as simple string at top level
        // This handles cases like metadata.nested.field
        let current = properties;
        for (let i = 0; i < fieldParts.length - 1; i++) {
          const part = fieldParts[i];
          if (!current[part]) {
            current[part] = {
              type: 'object',
              title: part,
              properties: {},
              required: []
            };
          }
          if (!current[part].properties) {
            current[part].properties = {};
          }
          if (!current[part].required) {
            current[part].required = [];
          }
          current = current[part].properties;
        }
        const lastPart = fieldParts[fieldParts.length - 1];
        current[lastPart] = {
          type: 'string',
          title: lastPart
        };

        // Add to required at appropriate level
        if (fieldParts.length === 1) {
          required.push(fieldParts[0]);
        }
      }
    });

    // Collect all unique field names at the top level of this namespace
    const topLevelFields = new Set();
    fields.forEach(fieldParts => {
      if (fieldParts.length > 0) {
        topLevelFields.add(fieldParts[0]);
      }
    });

    schema.properties[namespace] = {
      type: 'object',
      title: namespace,
      properties: properties,
      required: Array.from(topLevelFields)
    };
    schema.required.push(namespace);
  });

  return schema;
}

/**
 * Main execution
 */
function main() {
  try {
    // Read the template file
    const templatePath = path.resolve(argv.template);
    if (!fs.existsSync(templatePath)) {
      console.error(`Error: Template file not found: ${templatePath}`);
      process.exit(1);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Extract variables from template
    const variables = extractVariables(templateContent);

    // Build JSON Schema structure
    const schema = buildJsonSchema(variables);

    // Format output
    const output = JSON.stringify(schema, null, 2);

    // Write to file or stdout
    if (argv.output) {
      const outputPath = path.resolve(argv.output);
      fs.writeFileSync(outputPath, output, 'utf8');
      console.error(`Form schema written to: ${outputPath}`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

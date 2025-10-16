#!/usr/bin/env node

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const Form = require('@rjsf/core').default;
const validator = require('@rjsf/validator-ajv8').default;
const pretty = require('pretty');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('schema', {
    describe: 'Path to the form JSON schema file',
    type: 'string',
    demandOption: true,
  })
  .option('style', {
    describe: 'Path to the UI schema JSON file (optional)',
    type: 'string',
    demandOption: false,
  })
  .option('data', {
    describe: 'Path to the form data JSON file (optional)',
    type: 'string',
    demandOption: false,
  })
  .usage('Usage: $0 --schema <path> [--style <path>] [--data <path>]')
  .example('$0 --schema schema.json', 'Render an empty form with default styling')
  .example('$0 --schema schema.json --data data.json', 'Render a form with data and default styling')
  .example('$0 --schema schema.json --style style.json --data data.json', 'Render a form with custom UI schema and data')
  .help()
  .argv;

// Function to read and parse JSON files
function readJsonFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: File not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in file: ${filePath}`);
    } else {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
    process.exit(1);
  }
}

// Read the JSON files
const schema = readJsonFile(argv.schema);
const uiSchema = argv.style ? readJsonFile(argv.style) : {};
const formData = argv.data ? readJsonFile(argv.data) : {};

// Create the Form component
const FormComponent = () => {
  return React.createElement(Form, {
    schema: schema,
    uiSchema: uiSchema,
    formData: formData,
    validator: validator,
    // Disable the submit button since we're just rendering
    children: React.createElement('div'),
  });
};

// Render the form to HTML string
try {
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(FormComponent)
  );

  // Pretty print the HTML for human readability
  const formattedHtml = pretty(html, {
    ocd: true  // Enable all pretty printing options
  });

  // Output the formatted HTML to stdout
  console.log(formattedHtml);
} catch (error) {
  console.error('Error rendering form:', error.message);
  process.exit(1);
}
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('template', {
    describe: 'Path to the EJS template file',
    type: 'string',
    demandOption: true,
  })
  .option('data', {
    describe: 'Path to JSON data file(s) - can be specified multiple times',
    type: 'array',
    demandOption: true,
  })
  .usage('Usage: $0 --template <path> --data <path> [--data <path> ...]')
  .example('$0 --template template.ejs --data data.json', 'Render template with single data file')
  .example('$0 --template template.ejs --data data.json --data metadata.json', 'Render template with multiple data files')
  .help()
  .argv;

// Function to read and parse JSON file
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

// Function to read template file
function readTemplateFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    return fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: Template file not found: ${filePath}`);
    } else {
      console.error(`Error reading template ${filePath}:`, error.message);
    }
    process.exit(1);
  }
}

// Function to extract filename without extension
function getBasename(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

// Process data files
const dataContext = {};

// Ensure data is always an array
const dataFiles = Array.isArray(argv.data) ? argv.data : [argv.data];

// Read each data file and add to context with filename as namespace
dataFiles.forEach(dataFile => {
  const basename = getBasename(dataFile);
  const data = readJsonFile(dataFile);

  // Add data to context under filename namespace
  dataContext[basename] = data;

  if (process.env.DEBUG) {
    console.error(`Loaded data from ${dataFile} as '${basename}':`, data);
  }
});

// Read the template
const template = readTemplateFile(argv.template);

// Render the template with the data context
try {
  const rendered = ejs.render(template, dataContext, {
    filename: path.resolve(argv.template) // Helps with better error messages
  });

  // Output to stdout
  console.log(rendered);
} catch (error) {
  console.error('Error rendering template:', error.message);
  if (error.stack && process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}
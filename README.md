## Intro

This demos a "Document Driven Design" approach to an IaC catalog.

This is only meant to convey the idea it's not a production level version of the concept.

In reality you'd want to have bundles of items and multiple namespace layers and other features not shown here.

I'm also not advocating any specific language, template library, form library, etc...  This is just what was convenient for this demo.

The demo is for a **Simple S3 Bucket**.

This is all you get for a single evenings work.

## Setup

This assumes you have some recent version of `nodejs` installed.

Clone the repo and run `npm install`

## The Catalog

Each catalog item is represented by three documents.

  * [template.ejs](template.ejs) - a template of the final IaC output.
  * [schema.json](schema.json) - defines the fields and validation information to populate the template
  * [style.json](style.json) - optional styling information

## The Schema

You can auto-generate the starter values for the [schema.json](schema.json) file.

```
./generate-schema.js --template template.ejs --output schema.json
```

Technically you could fully generate these files from good terraform or from k8s schema definitions but that's a stretch goal beyond an evening demo.

Since [schema.json](schema.json) can be generated and [style.json](style.json) is optional the only requirement to adding a catalog item is [template.ejs](template.ejs).

## Rendering the Form

In this example we're dynamically rendering the HTML for the form the user would see based on the catalog files.

This would really be a library call the front-end code makes after fetching the catalog item info.

```
./generate-html.js --schema ./schema.json --style ./style.json > form.html
```

The generated content: [form.html](form.html)

## Response Data

The user eventually fills in the form and hits submit.

We're not running a web-server and rendering the page here so I've just supplied [data.json](data.json) to represent the users response.

## IaC Generation

The users response in [data.json](data.json) is then combined with the [metadata.json](metadata.json) and the [template.ejs](template.ejs) to produce [iac.tf](iac.tf).

The [metadata.json](metadata.json) file is just a stand-in for what the orchestration knows without the user having to manually enter it.

```
./generate-iac.js --template template.ejs --data metadata.json --data data.json > iac.tf
```

The [iac.tf](iac.tf) that is output is then applied via terraform.

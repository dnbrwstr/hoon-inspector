// import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import toml from "toml";
import { stringify } from "csv-stringify/sync";
import dotenv from "dotenv";
import Airtable from "airtable";

dotenv.config();

const glossaryPath =
  dirname(fileURLToPath(import.meta.url)) +
  "/developers.urbit.org/content/reference/glossary";

const terms = [];

fs.readdirSync(glossaryPath).map((file) => {
  const content = fs.readFileSync(`${glossaryPath}/${file}`, "utf8");
  if (!content) return;
  const [, frontMatter, markdown] = content.split("+++");
  //   const frontMatter = content.match(/\+\+\+([\s\S]+?)\+\+\+/);
  console.log(frontMatter, markdown);
  if (frontMatter) {
    const parsedFrontMatter = toml.parse(frontMatter);
    if (parsedFrontMatter.glossaryEntry) {
      terms.push(
        ...Object.values(parsedFrontMatter.glossaryEntry).map((o) => ({
          ...o,
          notes: markdown.trim().replace(/([^\n])\n([^\n])/gm, "$1 $2"),
        }))
      );
    }
  }
});

var base = new Airtable({ apiKey: process.env.AIRTABLE_WRITE_TOKEN }).base(
  "appRkyb7YMwIW0U98"
);

const batchSize = 10; // max allowed by airtable
function createTerms() {
  for (let i = 0; i < terms.length; i += batchSize) {
    const batch = terms.slice(i, i + batchSize);
    base("Vocab").create(
      batch.map((d) => {
        return {
          fields: {
            Name: d.name,
            Description: d.desc,
            Category: d.usage,
            Notes: d.notes,
          },
        };
      }),
      function (err, records) {
        if (err) {
          console.error(err);
          return;
        }
        records.forEach(function (record) {
          console.log(record.getId());
        });
      }
    );
  }
}

createTerms();

// fs.writeFileSync("./terms.csv", stringify(terms));

// console.log(stringify(terms));

// console.log(terms);

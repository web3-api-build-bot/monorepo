import { SchemaComposer } from "./SchemaComposer";
import { Project } from "./Project";
import { step, withSpinner } from "./helpers";

import { OutputDirectory, writeDirectory } from "@web3api/schema-bind";
import { parseSchema } from "@web3api/schema-parse";
import path from "path";
import fs, { readFileSync } from "fs";
import * as gluegun from "gluegun";
import { Ora } from "ora";
import Mustache from "mustache";

export interface CodeGeneratorConfig {
  outputDir: string;
  generationFile: string;
  project: Project;
  schemaComposer: SchemaComposer;
}

export class CodeGenerator {
  private _schema: string | undefined = "";

  constructor(private _config: CodeGeneratorConfig) {}

  public async generate(): Promise<boolean> {
    try {
      // Compile the API
      await this._generateCode();

      return true;
    } catch (e) {
      gluegun.print.error(e);
      return false;
    }
  }

  private async _generateCode() {
    const { schemaComposer, project } = this._config;

    const run = async (spinner?: Ora) => {
      // Make sure that the output dir exists, if not create a new one
      if (!fs.existsSync(this._config.outputDir)) {
        fs.mkdirSync(this._config.outputDir);
      }

      // Get the fully composed schema
      const composed = await schemaComposer.getComposedSchemas();
      const typeInfo = parseSchema(composed.combined || "");
      this._schema = composed.combined;

      // Check the generation file if it has the proper run() method
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, @typescript-eslint/naming-convention
      const generator = await require(this._config.generationFile);
      if (!generator) {
        throw Error("The generation file provided is wrong.");
      }

      const { run } = generator;
      if (!run) {
        throw Error(
          "The generation file provided doesn't have the 'run' method."
        );
      }

      const output: OutputDirectory = {
        entries: [],
      };

      await run(output, {
        typeInfo,
        generate: (templatePath: string, config: unknown) =>
          this._generateTemplate(templatePath, config, spinner),
      });

      writeDirectory(this._config.outputDir, output, (templatePath: string) =>
        this._generateTemplate(templatePath, typeInfo, spinner)
      );
    };

    if (project.quiet) {
      await run();
    } else {
      await withSpinner(
        "Generate types",
        "Failed to generate types",
        "Warnings while generating types",
        async (spinner) => {
          return run(spinner);
        }
      );
    }
  }

  private _generateTemplate(
    templatePath: string,
    config: unknown,
    spinner?: Ora
  ): string {
    const { project } = this._config;

    if (!project.quiet && spinner) {
      step(spinner, `Generating types from ${templatePath}`);
    }

    templatePath = path.join(
      path.dirname(this._config.generationFile),
      templatePath
    );

    const template = readFileSync(templatePath);
    const types =
      typeof config === "object" && config !== null ? config : { config };
    let content = Mustache.render(template.toString(), {
      ...types,
      schema: this._schema,
    });

    content = `// NOTE: This is generated by 'w3 codegen', DO NOT MODIFY

${content}
`;

    return content;
  }
}

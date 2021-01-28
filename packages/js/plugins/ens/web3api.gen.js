export default {
  run: (typeInfo: TypeInfo, output: OutputDirectory) => {
    output.entries.push({
      type: "File",
      name: "./schema.ts",
      data: generate("./templates/schema-ts.mustache", typeInfo)
    })
  }
}

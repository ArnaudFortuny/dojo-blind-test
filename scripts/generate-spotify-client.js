import { mkdir, writeFile } from "fs/promises";

import openapi from "../openapi.json" assert { type: 'json' };
import { type } from "os";
import { types } from "util";

const targetDirectory = "src/lib/spotify/model";

async function generateSpotifyClient() {
  console.log("\nLaunched generate-spotify-client script");
  console.log('Generating Spotify client from OpenApi spec file...\n')
  await mkdir(targetDirectory, { recursive: true }); // Generate target directory

  const schemas = openapi.components.schemas;
  const typesToGenerate = Object.keys(schemas);

  for (const typeName of typesToGenerate) {
    const typeSchema = schemas[typeName];
    generateType(typeName, typeSchema);
  }
}

function generateType(typeName, typeSchema) {  
  console.log(`Generating type ${typeName}...`);

  const generatedCode = getGeneratedCode(typeName, typeSchema);

  writeFile(`${targetDirectory}/${typeName}.ts`, generatedCode);
}

function getGeneratedCode(typeName, typeSchema) {
  const generatedType = getGeneratedType(typeSchema);

  var code = "";

  for (const property in typeSchema.properties) {

    if (typeSchema.properties[property].$ref){
      const ref = typeSchema.properties[property]["$ref"];
      const refObject = ref.split("/").at(-1);
      code += "import { " + refObject + " } from \"./" + refObject +"\";\n";
    }
  }

  return code + `\nexport type ${typeName} = ${generatedType};`;
}

function getGeneratedType(typeSchema) {
  const schemaType = typeSchema.type;

  // TO DO: Generate typescript code from schema
  switch (schemaType) {
    case "number": 
    case "integer": return "number";
    case "string": return "string";
    case "boolean": return "boolean";
    case "array":
    case "object":
      const required = typeSchema.required ?? [];
      var objectType = "{\n";
      for (const property in typeSchema.properties) {

        if (typeSchema.properties[property].$ref){
          const ref = typeSchema.properties[property]["$ref"];
          const refObject = ref.split("/").at(-1);
          for (const r in required){
            if (property == required[r]){
              inRequired = true;
            }
          }
          if (inRequired){
            objectType += " " + property + ": " + refObject + ";\n";
          }
          else {
            objectType += " " + property + "?: " + refObject + ";\n";
          }
          continue
        }

        const propertyType = getGeneratedType(typeSchema.properties[property]);
        var inRequired = false;
        for (const r in required){
          if (property == required[r]){
            inRequired = true;
          }
        }
        if (inRequired){
          objectType += " " + property + ": " + propertyType + ";\n";
        }
        else {
          objectType += " " + property + "?: " + propertyType + ";\n";
        }
        
      }
      objectType += "}";
      return objectType;
    default:
      return "";
  }
}

generateSpotifyClient();
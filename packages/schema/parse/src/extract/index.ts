import { TypeInfo } from "../typeInfo";
import { extractUserTypes } from "./user-types";
import { extractQueryTypes } from "./query-types";
import { extractImportedObjectTypes } from "./imported-object-types";
import { extractImportedQueryTypes } from "./imported-query-types";

import { DocumentNode } from "graphql";

export type SchemaExtractor = (
  astNode: DocumentNode,
  typeInfo: TypeInfo
) => void;

export const extractors: SchemaExtractor[] = [
  extractUserTypes,
  extractQueryTypes,
  extractImportedObjectTypes,
  extractImportedQueryTypes,
];
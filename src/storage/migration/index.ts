export {
  migrateSchemaV1ToV2,
  detectSchemaVersion,
  LEGACY_FIELD_MAPPINGS,
  type SchemaMigrationInput,
  type SchemaMigrationResult
} from "@/storage/migration/migrate-v1-to-v2";

export {
  migrateSchemaV2ToV3,
  type SchemaV3MigrationInput,
  type SchemaV3MigrationResult
} from "@/storage/migration/migrate-v2-to-v3";

export {
  migrateSchemaV3ToV4,
  type SchemaV4MigrationInput,
  type SchemaV4MigrationResult
} from "@/storage/migration/migrate-v3-to-v4";

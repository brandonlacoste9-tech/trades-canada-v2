import { Database as GeneratedDatabase } from "./database";

export type Database = GeneratedDatabase;

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

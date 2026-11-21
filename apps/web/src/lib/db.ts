import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://neondb_owner:npg_1PBUapz3woLh@ep-damp-feather-bcorvnwl.c-16.us-east-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(connectionString);

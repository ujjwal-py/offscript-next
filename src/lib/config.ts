export const config = {
  jwt_secret: process.env.JWT_SECRET || "",
  node_env: process.env.NODE_ENV || "development",
  database_url: process.env.DATABASE_URL || "",
  supabase_url: process.env.SUPABASE_URL || "",
  supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabase_bucket: process.env.SUPABASE_BUCKET || "",
};

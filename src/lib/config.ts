export const config = {
  jwt_secret: process.env.JWT_SECRET || "",
  database_url: process.env.DATABASE_URL || "",
  /** Directory (on disk) where post images are stored. Served at /uploads. */
  upload_dir: process.env.UPLOAD_DIR || "uploads",
  node_env: process.env.NODE_ENV || "development"
};

// Gunakan environment variables untuk keamanan
module.exports = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-sosial:XK3DcGMBJFna1kRx@sosial.qz5gv1w.mongodb.net/?retryWrites=true&w=majority",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "adminbaik123",
  SESSION_SECRET: process.env.SESSION_SECRET || "baeci-secret-key-2024"
};
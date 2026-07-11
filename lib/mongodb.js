import { MongoClient } from "mongodb";

// Vercel serverless 环境下缓存连接，避免每次请求都新建
let cached = global._mongoCache;
if (!cached) cached = global._mongoCache = { client: null, promise: null };

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("缺少环境变量 MONGODB_URI");
  if (!cached.client) {
    if (!cached.promise) {
      cached.promise = new MongoClient(uri).connect();
    }
    cached.client = await cached.promise;
  }
  return cached.client.db("hehao");
}

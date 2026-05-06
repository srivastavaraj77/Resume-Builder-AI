import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll } from "vitest";

let mongoServer;
let connectedToExternalMongo = false;

dotenv.config();

const buildTestMongoUri = (baseUri) => {
  const trimmed = String(baseUri || "").trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    parsed.pathname = "/resume_builder_test";
    return parsed.toString();
  } catch {
    // Fallback for unusual URI shapes.
    const [uriWithoutQuery, query = ""] = trimmed.split("?");
    const cleaned = uriWithoutQuery.endsWith("/")
      ? uriWithoutQuery.slice(0, -1)
      : uriWithoutQuery;
    const base = cleaned.includes("/")
      ? cleaned.replace(/\/[^/]*$/, "")
      : cleaned;
    const testUri = `${base}/resume_builder_test`;
    return query ? `${testUri}?${query}` : testUri;
  }
};

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret";
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test_gemini_key";
  process.env.GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const externalBaseUri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI;
  const externalTestUri = buildTestMongoUri(externalBaseUri);
  let externalError;

  if (externalTestUri) {
    try {
      connectedToExternalMongo = true;
      await mongoose.connect(externalTestUri, {
        serverSelectionTimeoutMS: 10000,
      });
      return;
    } catch (error) {
      connectedToExternalMongo = false;
      externalError = error;
      await mongoose.disconnect().catch(() => {});
    }
  }

  try {
    mongoServer = await MongoMemoryServer.create({ instance: { ip: "127.0.0.1" } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  } catch (memoryError) {
    const externalReason = externalError ? ` External DB error: ${externalError.message}.` : "";
    throw new Error(
      `Test DB unavailable. Set TEST_MONGODB_URI (or MONGODB_URI) to a reachable MongoDB instance.${externalReason} Memory DB error: ${memoryError.message}.`
    );
  }
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany({});
    })
  );
});

afterAll(async () => {
  if (connectedToExternalMongo && mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.dropDatabase();
    } catch (error) {
      const isUnauthorizedDrop =
        error?.name === "MongoServerError" &&
        (error?.codeName === "Unauthorized" ||
          /not allowed to do action \[dropDatabase\]/i.test(error?.message || ""));
      if (!isUnauthorizedDrop) {
        throw error;
      }
    }
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

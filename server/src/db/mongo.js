const { MongoClient } = require("mongodb");
const { env } = require("../config/env");

let client = null;
let connectPromise = null;

function resolveDbName() {
  if (env.MONGODB_DB_NAME) return env.MONGODB_DB_NAME;
  try {
    const parsed = new URL(env.MONGODB_URI);
    const pathname = parsed.pathname.replace(/^\//, "");
    if (pathname) return pathname;
  } catch {
    /* ignore malformed URI fallback */
  }
  return "room_rental_dev";
}

async function connectDb() {
  if (client) return client;
  if (!connectPromise) {
    const nextClient = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    nextClient.on("error", (error) => {
      console.error(JSON.stringify({
        event: "mongodb_client_error",
        errorName: error.name,
      }));
    });
    connectPromise = nextClient.connect()
      .then(() => {
        client = nextClient;
        return client;
      })
      .catch(async (error) => {
        connectPromise = null;
        await nextClient.close().catch(() => {});
        throw error;
      });
  }
  return connectPromise;
}

async function getDb() {
  const activeClient = await connectDb();
  return activeClient.db(resolveDbName());
}

async function getCollections() {
  const db = await getDb();
  return {
    adminAccounts: db.collection("admin_accounts"),
    adminSessions: db.collection("admin_sessions"),
    roomListings: db.collection("room_listings"),
    auditEvents: db.collection("audit_events"),
  };
}

async function pingDb() {
  const db = await getDb();
  await db.command({ ping: 1 });
}

async function ensureIndexes() {
  const { adminAccounts, adminSessions, roomListings, auditEvents } = await getCollections();
  await Promise.all([
    adminAccounts.createIndex({ identifier: 1 }, { unique: true, name: "uniq_admin_identifier" }),
    adminAccounts.createIndex({ singletonKey: 1 }, { unique: true, name: "uniq_primary_admin" }),
    adminSessions.createIndex({ tokenHash: 1 }, { unique: true, name: "uniq_session_token_hash" }),
    adminSessions.createIndex({ adminId: 1, revokedAt: 1 }, { name: "idx_sessions_admin" }),
    adminSessions.createIndex({ expiresAt: 1 }, { name: "idx_sessions_expires_at" }),
    roomListings.createIndex(
      { publishStatus: 1, deletedAt: 1, availability: 1, publishedAt: -1, updatedAt: -1 },
      { name: "idx_public_rooms_feed" },
    ),
    roomListings.createIndex({ publishStatus: 1, deletedAt: 1, ward: 1 }, { name: "idx_public_rooms_ward" }),
    roomListings.createIndex(
      { publishStatus: 1, deletedAt: 1, roomType: 1, priceVnd: 1 },
      { name: "idx_public_rooms_type_price" },
    ),
    roomListings.createIndex(
      { publishStatus: 1, deletedAt: 1, areaM2: 1, priceVnd: 1 },
      { name: "idx_public_rooms_area" },
    ),
    roomListings.createIndex(
      { publishStatus: 1, deletedAt: 1, amenities: 1 },
      { name: "idx_public_rooms_amenities" },
    ),
    roomListings.createIndex({ deletedAt: 1, updatedAt: -1 }, { name: "idx_admin_rooms_updated" }),
    roomListings.createIndex({ _id: 1, "images.id": 1 }, { name: "idx_room_image_lookup" }),
    auditEvents.createIndex({ createdAt: -1 }, { name: "idx_audit_created_at" }),
    auditEvents.createIndex({ entityType: 1, entityId: 1, createdAt: -1 }, { name: "idx_audit_entity" }),
  ]);
}

async function closeDb() {
  if (connectPromise) {
    try {
      const active = await connectPromise;
      await active.close();
    } catch {
      /* ignore connect failure on shutdown */
    }
  } else if (client) {
    await client.close().catch(() => {});
  }
  client = null;
  connectPromise = null;
}

module.exports = {
  connectDb,
  getDb,
  getCollections,
  pingDb,
  ensureIndexes,
  closeDb,
};


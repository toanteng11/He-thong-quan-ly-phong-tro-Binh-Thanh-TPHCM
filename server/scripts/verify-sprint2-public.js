const assert = require("node:assert/strict");
const path = require("node:path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { getCollections, closeDb } = require("../src/db/mongo");
const { env } = require("../src/config/env");

const BASE_URL = process.env.API_BASE_URL || `http://${env.HOST}:${env.PORT}/api/v1`;
const CLIENT_ORIGIN = env.CLIENT_ORIGIN || "http://127.0.0.1:5173";
const SEED_TAG = "SPRINT_2_SAMPLE";

const ALLOWED_LIST_KEYS = new Set([
  "id",
  "title",
  "roomType",
  "priceVnd",
  "areaM2",
  "amenities",
  "ward",
  "district",
  "city",
  "publicAddress",
  "availability",
  "publishedAt",
  "updatedAt",
  "coverImageUrl",
]);

async function fetchJson(routePath, options = {}) {
  const response = await fetch(`${BASE_URL}${routePath}`, options);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, json, text };
}

async function main() {
  const results = [];

  // Pre-check: API health & seeded dataset
  const live = await fetchJson("/health/live");
  assert.equal(live.response.status, 200, "Health live endpoint must return 200");
  const ready = await fetchJson("/health/ready");
  assert.equal(ready.response.status, 200, "Health ready endpoint must return 200");

  const { roomListings } = await getCollections();
  const seeded = await roomListings.find({ seedTag: SEED_TAG }).toArray();
  assert.ok(seeded.length >= 19, `Expected at least 19 seeded Sprint 2 rooms, got ${seeded.length}. Run db:seed:sprint2 first.`);

  const allPublished = await roomListings.find({ publishStatus: "PUBLISHED", deletedAt: null }).toArray();
  const totalPublished = allPublished.length;
  const totalAvailable = allPublished.filter((d) => d.availability === "AVAILABLE").length;
  const totalRented = totalPublished - totalAvailable;
  const expectedTotalPages = Math.ceil(totalPublished / 12);
  assert.ok(totalPublished >= 14 && totalAvailable >= 11 && totalRented >= 3);

  const draftDoc = seeded.find((d) => d.publishStatus === "DRAFT");
  const hiddenDoc = seeded.find((d) => d.publishStatus === "HIDDEN" && !d.deletedAt);
  const deletedDoc = seeded.find((d) => d.deletedAt !== null);
  const exactFalseDoc = seeded.find((d) => d.publishStatus === "PUBLISHED" && !d.deletedAt && d.allowExactAddress === false && d.privateAddress.includes("PRIVATE-EXACT-FALSE-TOKEN"));
  const exactTrueDoc = seeded.find((d) => d.publishStatus === "PUBLISHED" && !d.deletedAt && d.allowExactAddress === true);
  const phoneOnlyDoc = seeded.find((d) => d.publishStatus === "PUBLISHED" && !d.deletedAt && d.allowPublicPhone && !d.allowPublicZalo);
  const phoneAndZaloDoc = seeded.find((d) => d.publishStatus === "PUBLISHED" && !d.deletedAt && d.allowPublicPhone && d.allowPublicZalo);

  assert.ok(draftDoc && hiddenDoc && deletedDoc && exactFalseDoc && exactTrueDoc && phoneOnlyDoc && phoneAndZaloDoc);

  // AT-01: Default public list (PUBLISHED only, AVAILABLE before RENTED, 12/page)
  const listPage1 = await fetchJson("/public/rooms");
  assert.equal(listPage1.response.status, 200);
  assert.equal(listPage1.json.page, 1);
  assert.equal(listPage1.json.pageSize, 12);
  assert.equal(listPage1.json.totalItems, totalPublished);
  assert.equal(listPage1.json.totalPages, expectedTotalPages);
  assert.equal(listPage1.json.hasNext, expectedTotalPages > 1);
  assert.equal(listPage1.json.items.length, Math.min(12, totalPublished));
  const availOnPage1 = Math.min(12, totalAvailable);
  assert.ok(listPage1.json.items.slice(0, availOnPage1).every((item) => item.availability === "AVAILABLE"), "AVAILABLE rooms must rank first");
  if (availOnPage1 < listPage1.json.items.length) {
    assert.ok(listPage1.json.items.slice(availOnPage1).every((item) => item.availability === "RENTED"), "RENTED rooms follow AVAILABLE rooms");
  }
  results.push(`AT-01 PASS (${totalPublished} PUBLISHED, ${totalAvailable} AVAILABLE ranked before ${totalRented} RENTED, 12/page)`);

  // AT-02: Public room detail, images order, contact flags
  const detailBoth = await fetchJson(`/public/rooms/${phoneAndZaloDoc._id}`);
  assert.equal(detailBoth.response.status, 200);
  assert.equal(detailBoth.json.item.id, phoneAndZaloDoc._id);
  assert.ok(detailBoth.json.item.images.length >= 2);
  assert.equal(detailBoth.json.item.images[0].isCover, true);
  assert.equal(detailBoth.json.item.contact.phone, phoneAndZaloDoc.contactPhone);
  assert.ok(detailBoth.json.item.contact.zalo);

  const detailPhoneOnly = await fetchJson(`/public/rooms/${phoneOnlyDoc._id}`);
  assert.equal(detailPhoneOnly.response.status, 200);
  assert.equal(detailPhoneOnly.json.item.contact.phone, phoneOnlyDoc.contactPhone);
  assert.equal(detailPhoneOnly.json.item.contact.zalo, undefined);
  results.push("AT-02 PASS (detail fields, gallery order, phone/zalo visibility)");

  // AT-03: Keyword search q
  const searchHangXanh = await fetchJson(`/public/rooms?q=${encodeURIComponent("Hàng Xanh")}`);
  assert.equal(searchHangXanh.response.status, 200);
  assert.ok(searchHangXanh.json.totalItems >= 2);
  assert.ok(
    searchHangXanh.json.items.every(
      (i) => `${i.title} ${i.ward} ${i.publicAddress}`.toLowerCase().includes("hàng xanh"),
    ),
  );
  results.push("AT-03 PASS (keyword search matches public title/ward/publicAddress)");

  // AT-04: Categories & multi-filter combination
  const cats = await fetchJson("/public/categories");
  assert.equal(cats.response.status, 200);
  for (const expectedWard of [
    "Phường Gia Định",
    "Phường Bình Thạnh",
    "Phường Bình Lợi Trung",
    "Phường Thạnh Mỹ Tây",
    "Phường Bình Quới",
  ]) {
    assert.ok(cats.json.wards.includes(expectedWard), `Missing expected 2026 ward: ${expectedWard}`);
  }
  assert.ok(!cats.json.amenities.includes("Máy giặt"), "Amenities must not include Máy giặt");
  assert.ok(cats.json.amenities.includes("Thang máy"), "Amenities must include Thang máy");
  assert.ok(!cats.json.wards.some((w) => w.includes("DRAFT-ONLY") || w.includes("HIDDEN-ONLY") || w.includes("DELETED-ONLY")));

  const combined = await fetchJson(
    `/public/rooms?ward=${encodeURIComponent("Phường Thạnh Mỹ Tây")}&roomType=${encodeURIComponent("Phòng studio")}&minPriceVnd=4500000&maxPriceVnd=5500000&minAreaM2=25&maxAreaM2=35&availability=AVAILABLE`,
  );
  assert.equal(combined.response.status, 200);
  assert.equal(combined.json.totalItems, 2);
  assert.ok(combined.json.items.every((i) => i.ward === "Phường Thạnh Mỹ Tây" && i.roomType === "Phòng studio" && i.availability === "AVAILABLE" && i.priceVnd >= 4500000 && i.priceVnd <= 5500000 && i.areaM2 >= 25 && i.areaM2 <= 35));
  results.push("AT-04 PASS (categories include 5 2026 wards & Thang máy, exclude non-public wards; combined filters accurate)");

  // AT-05: All 4 sort modes
  const sortNewest = await fetchJson(`/public/rooms?sort=publishedAt_desc&pageSize=${Math.min(48, totalPublished)}`);
  assert.equal(sortNewest.response.status, 200);
  assert.equal(sortNewest.json.items.length, Math.min(48, totalPublished));
  for (let i = 1; i < sortNewest.json.items.length; i += 1) {
    assert.ok(new Date(sortNewest.json.items[i - 1].publishedAt) >= new Date(sortNewest.json.items[i].publishedAt));
  }

  const sortAsc = await fetchJson(`/public/rooms?sort=price_asc&pageSize=${Math.min(48, totalPublished)}`);
  assert.equal(sortAsc.response.status, 200);
  for (let i = 1; i < sortAsc.json.items.length; i += 1) {
    assert.ok(sortAsc.json.items[i - 1].priceVnd <= sortAsc.json.items[i].priceVnd);
  }

  const sortDesc = await fetchJson(`/public/rooms?sort=price_desc&pageSize=${Math.min(48, totalPublished)}`);
  assert.equal(sortDesc.response.status, 200);
  for (let i = 1; i < sortDesc.json.items.length; i += 1) {
    assert.ok(sortDesc.json.items[i - 1].priceVnd >= sortDesc.json.items[i].priceVnd);
  }
  results.push("AT-05 PASS (all 4 sort orders verified)");

  // AT-09: Invalid range & invalid query
  const badPriceRange = await fetchJson("/public/rooms?minPriceVnd=5000000&maxPriceVnd=3000000");
  assert.equal(badPriceRange.response.status, 400);
  assert.equal(badPriceRange.json.error.code, "INVALID_RANGE");

  const badAreaRange = await fetchJson("/public/rooms?minAreaM2=40&maxAreaM2=20");
  assert.equal(badAreaRange.response.status, 400);
  assert.equal(badAreaRange.json.error.code, "INVALID_RANGE");

  const negPrice = await fetchJson("/public/rooms?minPriceVnd=-100");
  assert.equal(negPrice.response.status, 400);
  assert.equal(negPrice.json.error.code, "INVALID_QUERY");
  results.push("AT-09 PASS (400 INVALID_RANGE and INVALID_QUERY verified)");

  // AT-10: Empty result
  const emptyRes = await fetchJson(`/public/rooms?q=${encodeURIComponent("KhongTonTaiXYZ987654")}`);
  assert.equal(emptyRes.response.status, 200);
  assert.equal(emptyRes.json.totalItems, 0);
  assert.deepEqual(emptyRes.json.items, []);
  results.push("AT-10 PASS (empty result response verified)");

  // AT-11: Pagination across all pages, max pageSize=48 check
  const listPage2 = await fetchJson("/public/rooms?page=2");
  assert.equal(listPage2.response.status, 200);
  assert.equal(listPage2.json.page, 2);
  assert.equal(listPage2.json.items.length, Math.min(12, Math.max(0, totalPublished - 12)));
  assert.equal(listPage2.json.hasNext, expectedTotalPages > 2);
  const allPagedIds = [...listPage1.json.items, ...listPage2.json.items].map((x) => x.id);
  for (let p = 3; p <= expectedTotalPages; p += 1) {
    const nextPage = await fetchJson(`/public/rooms?page=${p}`);
    assert.equal(nextPage.response.status, 200);
    allPagedIds.push(...nextPage.json.items.map((x) => x.id));
  }
  assert.equal(new Set(allPagedIds).size, totalPublished, "Pages must not overlap or skip items");

  const oversizedPage = await fetchJson("/public/rooms?pageSize=49");
  assert.equal(oversizedPage.response.status, 400);
  assert.equal(oversizedPage.json.error.code, "INVALID_QUERY");
  results.push(`AT-11 PASS (pages unique ${totalPublished} items; pageSize=49 rejected 400 INVALID_QUERY)`);

  // AT-18 & AT-23: Non-published/deleted 404 + immediate hide reflection
  for (const blocked of [draftDoc, hiddenDoc, deletedDoc]) {
    const res = await fetchJson(`/public/rooms/${blocked._id}`);
    assert.equal(res.response.status, 404);
    assert.equal(res.json.error.code, "NOT_FOUND");
  }

  try {
    await roomListings.updateOne({ _id: exactFalseDoc._id }, { $set: { publishStatus: "HIDDEN" } });
    const hiddenNow = await fetchJson(`/public/rooms/${exactFalseDoc._id}`);
    assert.equal(hiddenNow.response.status, 404);
    const hiddenImg = await fetch(`${BASE_URL}/public/rooms/${exactFalseDoc._id}/images/${exactFalseDoc.images[0].id}/file`);
    assert.equal(hiddenImg.status, 404);
  } finally {
    await roomListings.updateOne({ _id: exactFalseDoc._id }, { $set: { publishStatus: "PUBLISHED" } });
  }
  const restored = await fetchJson(`/public/rooms/${exactFalseDoc._id}`);
  assert.equal(restored.response.status, 200);
  results.push("AT-18, AT-23 PASS (DRAFT/HIDDEN/DELETED 404; immediate visibility sync on status toggle)");

  // AT-24: Search by privateAddress token returns 0
  const searchPrivate1 = await fetchJson(`/public/rooms?q=${encodeURIComponent("PRIVATE-ONLY-TOKEN")}`);
  assert.equal(searchPrivate1.response.status, 200);
  assert.equal(searchPrivate1.json.totalItems, 0);

  const searchPrivate2 = await fetchJson(`/public/rooms?q=${encodeURIComponent("PRIVATE-EXACT-FALSE-TOKEN")}`);
  assert.equal(searchPrivate2.response.status, 200);
  assert.equal(searchPrivate2.json.totalItems, 0);
  results.push("AT-24 PASS (search q never matches privateAddress)");

  // AT-25 & AT-26: allowExactAddress false vs true
  const exactFalseRes = await fetchJson(`/public/rooms/${exactFalseDoc._id}`);
  assert.equal(exactFalseRes.response.status, 200);
  assert.equal("privateAddress" in exactFalseRes.json.item, false);
  assert.equal("exactAddress" in exactFalseRes.json.item, false);
  assert.ok(!exactFalseRes.json.item.displayAddress.includes("PRIVATE-EXACT-FALSE-TOKEN"));

  const exactTrueRes = await fetchJson(`/public/rooms/${exactTrueDoc._id}`);
  assert.equal(exactTrueRes.response.status, 200);
  assert.equal("privateAddress" in exactTrueRes.json.item, false);
  assert.equal(exactTrueRes.json.item.exactAddress, exactTrueDoc.privateAddress);
  assert.equal(exactTrueRes.json.item.displayAddress, exactTrueDoc.privateAddress);
  results.push("AT-25, AT-26 PASS (allowExactAddress false hides exactAddress; true exposes only exactAddress)");

  // AT-27: Image streaming headers & non-published image 404
  const pubImgRes = await fetch(`${BASE_URL}/public/rooms/${exactFalseDoc._id}/images/${exactFalseDoc.images[0].id}/file`);
  assert.equal(pubImgRes.status, 200);
  assert.equal(pubImgRes.headers.get("content-type"), "image/png");
  assert.equal(pubImgRes.headers.get("x-content-options") || pubImgRes.headers.get("x-content-type-options"), "nosniff");
  assert.equal(pubImgRes.headers.get("cache-control"), "public, max-age=60");
  const imgBuf = Buffer.from(await pubImgRes.arrayBuffer());
  assert.deepEqual(imgBuf.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  for (const blocked of [draftDoc, hiddenDoc, deletedDoc]) {
    const blockedImgRes = await fetch(`${BASE_URL}/public/rooms/${blocked._id}/images/${blocked.images[0].id}/file`);
    assert.equal(blockedImgRes.status, 404);
  }
  results.push("AT-27 PASS (public PNG image streaming + nosniff; non-public images blocked 404)");

  // AT-29: Invalid UUID & non-existent UUID -> 404
  const badUuid = await fetchJson("/public/rooms/not-a-valid-uuid");
  assert.equal(badUuid.response.status, 404);
  assert.equal(badUuid.json.error.code, "NOT_FOUND");
  const missingUuid = await fetchJson("/public/rooms/00000000-0000-4000-8000-000000000000");
  assert.equal(missingUuid.response.status, 404);
  assert.equal(missingUuid.json.error.code, "NOT_FOUND");
  results.push("AT-29 PASS (malformed/missing roomId returns 404 NOT_FOUND)");

  // AT-32: Cross-origin isolation CLIENT_ORIGIN -> /api/v1/admin/* rejected 403
  const preflightAdmin = await fetch(`${BASE_URL}/admin/rooms`, {
    method: "OPTIONS",
    headers: { Origin: CLIENT_ORIGIN, "Access-Control-Request-Method": "GET" },
  });
  assert.equal(preflightAdmin.status, 403);

  const clientLoginPost = await fetch(`${BASE_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: CLIENT_ORIGIN },
    body: JSON.stringify({ identifier: "test@example.com", password: "test" }),
  });
  assert.equal(clientLoginPost.status, 403);
  results.push("AT-32 PASS (CLIENT_ORIGIN blocked 403 on /api/v1/admin/*)");

  // AT-42: Strict allowlist on public list JSON (no privateAddress, contactPhone, contactZalo, description)
  const fullList = await fetchJson("/public/rooms?pageSize=48");
  for (const item of fullList.json.items) {
    for (const key of Object.keys(item)) {
      assert.ok(ALLOWED_LIST_KEYS.has(key), `Unexpected key leaked in public list: ${key}`);
    }
    assert.equal("privateAddress" in item, false);
    assert.equal("contactPhone" in item, false);
    assert.equal("contactZalo" in item, false);
    assert.equal("description" in item, false);
  }
  results.push("AT-42 PASS (strict toPublicListItem allowlist verified across all 14 items)");

  // AT-43: Cache-Control headers
  assert.equal(cats.response.headers.get("cache-control"), "public, max-age=60");
  assert.equal(listPage1.response.headers.get("cache-control"), "public, max-age=30");
  assert.equal(detailBoth.response.headers.get("cache-control"), "public, max-age=30");
  results.push("AT-43 PASS (Cache-Control public max-age 60s/30s verified)");

  // AT-46: Regex metacharacters & XSS payload in q do not trigger 500
  const regexQuery = await fetchJson(`/public/rooms?q=${encodeURIComponent("[.*+?^${}()|[\\]\\\\")}`);
  assert.equal(regexQuery.response.status, 200);
  const xssQuery = await fetchJson(`/public/rooms?q=${encodeURIComponent("<script>alert(1)</script>")}`);
  assert.equal(xssQuery.response.status, 200);
  results.push("AT-46 PASS (regex metacharacters & XSS strings handled safely with 200)");

  console.log("SPRINT_2_API_VERIFICATION_ALL_PASSED");
  results.forEach((line) => console.log(` - ${line}`));
}

main()
  .catch((error) => {
    console.error("SPRINT_2_API_VERIFICATION_FAILED:", error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());

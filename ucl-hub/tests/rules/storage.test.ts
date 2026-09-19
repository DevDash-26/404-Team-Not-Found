import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { afterAll, beforeAll, describe, it } from "vitest";
import { as, createEnv, uidOf } from "./harness";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createEnv();
});
afterAll(async () => {
  await env.cleanup();
});

const png = (bytes = 100) => ({ data: new Uint8Array(bytes), metadata: { contentType: "image/png" } });

describe("storage rules", () => {
  it("lets students upload images into their own folder only", async () => {
    const storage = as(env, "student").storage();
    const me = uidOf("student");
    await assertSucceeds(uploadBytes(ref(storage, `uploads/${me}/lost-found/a.png`), png().data, png().metadata));
    await assertFails(uploadBytes(ref(storage, `uploads/${uidOf("student2")}/lost-found/a.png`), png().data, png().metadata));
  });

  it("refuses files that are not images, and images over 5 MB", async () => {
    const storage = as(env, "student").storage();
    const me = uidOf("student");
    await assertFails(uploadBytes(ref(storage, `uploads/${me}/x.pdf`), new Uint8Array(100), { contentType: "application/pdf" }));
    await assertFails(uploadBytes(ref(storage, `uploads/${me}/big.png`), png(5 * 1024 * 1024 + 1).data, png().metadata));
  });

  it("keeps official content read-only for students", async () => {
    const student = as(env, "student").storage();
    await assertFails(uploadBytes(ref(student, "content/events/banner.png"), png().data, png().metadata));
    await assertSucceeds(uploadBytes(ref(as(env, "academic").storage(), "content/events/banner.png"), png().data, png().metadata));
    await assertSucceeds(uploadBytes(ref(as(env, "admin").storage(), "content/announcements/notice.pdf"), new Uint8Array(100), { contentType: "application/pdf" }));
    await assertFails(deleteObject(ref(student, "content/events/banner.png")));
  });

  it("denies signed-out visitors and unknown paths", async () => {
    await assertFails(uploadBytes(ref(as(env, "anonymous").storage(), "uploads/x/a.png"), png().data, png().metadata));
    await assertFails(uploadBytes(ref(as(env, "admin").storage(), "secret/a.png"), png().data, png().metadata));
  });
});

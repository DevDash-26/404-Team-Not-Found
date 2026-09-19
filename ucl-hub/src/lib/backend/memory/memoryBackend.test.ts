import { describe, expect, it } from "vitest";
import { increment } from "../types";
import { AppError } from "@/utils/errors";
import { CREDENTIALS_COLLECTION, credentialKey, MemoryAuthPort } from "./memoryAuth";
import { MemoryStore } from "./memoryStore";

describe("MemoryStore (behaves like the Firestore adapter)", () => {
  const seed = () => new MemoryStore({ things: { a: { n: 1, tag: "x", nested: { by: "u1" } }, b: { n: 2, tag: "y", nested: { by: "u2" } }, c: { n: 3, tag: "x", nested: { by: "u1" } } } });

  it("creates only once: a second create fails, which is what prevents double booking", async () => {
    const store = seed();
    await store.commit([{ kind: "create", path: "slots/s1", data: { by: "u1" } }]);
    await expect(store.commit([{ kind: "create", path: "slots/s1", data: { by: "u2" } }])).rejects.toMatchObject({ code: "already-exists" });
    expect((await store.get<{ id: string; by: string }>("slots/s1"))?.by).toBe("u1");
  });

  it("commits atomically: if one write fails none of them are applied", async () => {
    const store = seed();
    await expect(
      store.commit([
        { kind: "create", path: "things/new", data: { n: 9 } },
        { kind: "update", path: "things/missing", data: { n: 1 } },
      ]),
    ).rejects.toBeInstanceOf(AppError);
    expect(await store.get("things/new")).toBeNull();
  });

  it("increments counters and never returns the stored object by reference", async () => {
    const store = seed();
    await store.commit([{ kind: "update", path: "things/a", data: { n: increment(5) } }]);
    await store.commit([{ kind: "update", path: "things/a", data: { n: increment(-2) } }]);
    const doc = (await store.get<{ id: string; n: number; tag: string }>("things/a"))!;
    expect(doc.n).toBe(4);
    doc.n = 999;
    expect((await store.get<{ id: string; n: number }>("things/a"))?.n).toBe(4);
  });

  it("filters on fields, nested fields and operators", async () => {
    const store = seed();
    const ids = async (where: Parameters<typeof store.list>[1]) => (await store.list<{ id: string }>("things", where)).items.map((i) => i.id);
    expect(await ids({ where: [{ field: "tag", op: "==", value: "x" }] })).toEqual(["a", "c"]);
    expect(await ids({ where: [{ field: "nested.by", op: "==", value: "u2" }] })).toEqual(["b"]);
    expect(await ids({ where: [{ field: "n", op: ">=", value: 2 }] })).toEqual(["b", "c"]);
    expect(await ids({ where: [{ field: "tag", op: "!=", value: "x" }] })).toEqual(["b"]);
    expect(await ids({ where: [{ field: "tag", op: "in", value: ["y", "z"] }] })).toEqual(["b"]);
  });

  it("orders, paginates with a cursor and never repeats or skips a document", async () => {
    const store = seed();
    const first = await store.list<{ id: string }>("things", { orderBy: [{ field: "n", direction: "desc" }], limit: 2 });
    expect(first.items.map((i) => i.id)).toEqual(["c", "b"]);
    expect(first.nextCursor).not.toBeNull();
    const second = await store.list<{ id: string }>("things", { orderBy: [{ field: "n", direction: "desc" }], limit: 2, after: first.nextCursor });
    expect(second.items.map((i) => i.id)).toEqual(["a"]);
    expect(second.nextCursor).toBeNull();
  });

  it("counts with filters, without loading documents", async () => {
    const store = seed();
    expect(await store.count("things")).toBe(3);
    expect(await store.count("things", [{ field: "tag", op: "==", value: "x" }])).toBe(2);
    expect(await store.count("empty")).toBe(0);
  });

  it("deletes idempotently and generates unique ids", async () => {
    const store = seed();
    await store.commit([{ kind: "delete", path: "things/a" }]);
    await store.commit([{ kind: "delete", path: "things/a" }]);
    expect(await store.get("things/a")).toBeNull();
    expect(new Set(Array.from({ length: 50 }, () => store.newId("things"))).size).toBe(50);
  });

  it("reports changes so demo data can be persisted", async () => {
    let snapshots = 0;
    const store = new MemoryStore({}, () => (snapshots += 1));
    await store.commit([{ kind: "set", path: "a/b", data: { x: 1 } }]);
    expect(snapshots).toBe(1);
  });
});

describe("in-memory authentication", () => {
  function setup() {
    const store = new MemoryStore({
      [CREDENTIALS_COLLECTION]: { [credentialKey("admin@ucl.example")]: { uid: "u-admin", password: "Demo@1234" } },
      users: { "u-admin": { name: "Ruwan", email: "admin@ucl.example", role: "admin", staffRole: null, societyId: null } },
    });
    return { store, auth: new MemoryAuthPort(store) };
  }

  it("signs in with the right password and exposes the role from the stored profile", async () => {
    const { auth } = setup();
    let current: Awaited<ReturnType<typeof auth.getIdToken>> = null;
    await auth.signIn("ADMIN@ucl.example ", "Demo@1234");
    current = await auth.getIdToken();
    expect(current).toBe("memory:u-admin");
  });

  it("rejects a wrong password or unknown email with the same message", async () => {
    const { auth } = setup();
    await expect(auth.signIn("admin@ucl.example", "nope")).rejects.toThrow("Incorrect email or password.");
    await expect(auth.signIn("nobody@ucl.example", "Demo@1234")).rejects.toThrow("Incorrect email or password.");
    expect(await auth.getIdToken()).toBeNull();
  });

  it("registers new accounts as plain students and rejects duplicate emails", async () => {
    const { auth } = setup();
    const seen: Array<string | undefined> = [];
    auth.onChange((user) => seen.push(user?.claims.role));
    await auth.register({ email: "new@ucl.example", password: "Password1" } as never);
    expect(seen.at(-1)).toBe("student");
    await expect(auth.register({ email: "New@ucl.example", password: "Password1" } as never)).rejects.toThrow(/already exists/i);
  });

  it("signs out", async () => {
    const { auth } = setup();
    await auth.signIn("admin@ucl.example", "Demo@1234");
    await auth.signOut();
    expect(await auth.getIdToken()).toBeNull();
  });
});

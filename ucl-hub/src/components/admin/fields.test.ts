import { describe, expect, it } from "vitest";
import { EVERYONE } from "@/types";
import { emptyRow, initialValues, toPayload, type FieldDef } from "./fields";

const fields: FieldDef[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "capacity", label: "Capacity", type: "number" },
  { name: "startsAt", label: "Starts", type: "datetime" },
  { name: "expiresAt", label: "Expires", type: "datetime", nullable: true },
  { name: "active", label: "Active", type: "checkbox" },
  { name: "skills", label: "Skills", type: "tags" },
  { name: "societyId", label: "Society", type: "select", nullable: true, options: [] },
  { name: "audience", label: "Audience", type: "audience" },
  { name: "imageUrl", label: "Image", type: "image", pathName: "imagePath", folder: "content/events" },
  { name: "hours", label: "Hours", type: "list", addLabel: "Add", itemLabel: "Line", itemFields: [{ name: "days", label: "Days", type: "text" }, { name: "open", label: "Open", type: "checkbox" }] },
];

describe("admin form field conversion", () => {
  it("builds empty values for a new record from defaults", () => {
    const values = initialValues(fields, null, { capacity: 10, active: true });
    expect(values.title).toBe("");
    expect(values.capacity).toBe("10");
    expect(values.active).toBe(true);
    expect(values.audience).toEqual(EVERYONE);
    expect(values.imageUrl).toBeNull();
    expect(values.hours).toEqual([]);
  });

  it("fills values from an existing record", () => {
    const values = initialValues(fields, {
      title: "Hack night",
      capacity: 40,
      startsAt: "2026-09-20T10:00:00.000Z",
      expiresAt: null,
      active: false,
      skills: ["React", "SQL"],
      societyId: null,
      audience: { faculties: ["computing"], programmes: [], years: [2] },
      imageUrl: "https://x/y.jpg",
      imagePath: "content/events/y.jpg",
      hours: [{ days: "Mon", open: true }],
    });
    expect(values.capacity).toBe("40");
    expect(values.skills).toBe("React, SQL");
    expect(values.expiresAt).toBe("");
    expect(values.imageUrl).toEqual({ url: "https://x/y.jpg", path: "content/events/y.jpg" });
    expect(String(values.startsAt)).toMatch(/^2026-09-20T\d\d:\d\d$/);
    expect(values.hours).toEqual([{ days: "Mon", open: true }]);
  });

  it("does not share array or object references with the record being edited", () => {
    const audience = { faculties: ["computing"], programmes: [], years: [] as number[] };
    const values = initialValues(fields, { audience });
    (values.audience as typeof audience).faculties.push("business");
    expect(audience.faculties).toEqual(["computing"]);
  });

  it("converts form values into the payload the schema validates", () => {
    const payload = toPayload(fields, {
      title: "  Hack night ",
      capacity: "40",
      startsAt: "2026-09-20T10:00",
      expiresAt: "",
      active: true,
      skills: "React, SQL, React",
      societyId: "",
      audience: EVERYONE,
      imageUrl: { url: "u", path: "p" },
      hours: [{ days: "Mon", open: true }],
    });
    expect(payload.capacity).toBe(40);
    expect(payload.expiresAt).toBeNull();
    expect(payload.societyId).toBeNull();
    expect(payload.skills).toEqual(["React", "SQL"]);
    expect(payload.imageUrl).toBe("u");
    expect(payload.imagePath).toBe("p");
    expect(new Date(String(payload.startsAt)).toISOString()).toBe(payload.startsAt);
    expect(payload.hours).toEqual([{ days: "Mon", open: true }]);
  });

  it("turns an empty or blank number into NaN so validation can complain", () => {
    expect(Number.isNaN(toPayload(fields, { capacity: "" }).capacity)).toBe(true);
    expect(Number.isNaN(toPayload(fields, { capacity: "  " }).capacity)).toBe(true);
  });

  it("clears the image fields when the image is removed", () => {
    const payload = toPayload(fields, { imageUrl: null });
    expect(payload.imageUrl).toBeNull();
    expect(payload.imagePath).toBeNull();
  });

  it("creates an empty row for list fields", () => {
    const list = fields.find((f): f is Extract<FieldDef, { type: "list" }> => f.type === "list")!;
    expect(emptyRow(list)).toEqual({ days: "", open: false });
  });
});

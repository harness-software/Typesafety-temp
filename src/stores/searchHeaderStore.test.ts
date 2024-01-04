import { describe, it, expect } from "vitest";

function convertToStringQueryParam(
  data: Record<string, unknown>
): URLSearchParams | null {
  if (!data) return null;

  const result = new URLSearchParams();

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      result.set(key, value);
    } else if (typeof value === "number") {
      result.set(key, value.toString());
    } else if (typeof value === "boolean") {
      result.set(key, value.toString());
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        result.append(key, item.toString());
      });
    } else {
      result.set(key, JSON.stringify(value));
    }
  }

  return result;
}

describe("convertToStringQueryParam", () => {
  it("should convert all values in the input object to strings", () => {
    const input = {
      name: "John",
      age: 30,
      isActive: true,
      someArray: [1, 2, 3],
      someObject: { a: 1, b: 2 },
    };

    const actual = convertToStringQueryParam(input);
    const expected = new URLSearchParams({
      name: "John",
      age: "30",
      isActive: "true",
    });

    expected.append("someArray", "1");
    expected.append("someArray", "2");
    expected.append("someArray", "3");
    expected.append("someObject", '{"a":1,"b":2}');

    expect(actual?.toString()).toEqual(expected?.toString());
  });

  it("should convert null values in the input object to empty strings", () => {
    const input = {
      name: null,
      age: null,
      isActive: null,
      someArray: null,
      someObject: null,
    };

    const expectedOutput = new URLSearchParams();

    const result = convertToStringQueryParam(input);

    expect(result).toEqual(expectedOutput);
  });
});

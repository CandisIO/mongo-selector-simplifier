import { parseSelector } from "../parse-selector";

describe("parseSelector", () => {
  it("should throw exception when $and, $or or $nor is encountered", () => {
    expect(() => {
      parseSelector({
        $and: [{ foo: "bar" }]
      });
    }).toThrow("$and");
    expect(() => {
      parseSelector({
        baz: "cow",
        $and: [{ foo: "bar" }]
      });
    }).toThrow("$and");
    expect(() => {
      parseSelector({
        $or: [{ foo: "bar" }]
      });
    }).toThrow("$or");
    expect(() => {
      parseSelector({
        baz: "cow",
        $or: [{ foo: "bar" }]
      });
    }).toThrow("$or");
    expect(() => {
      parseSelector({
        $nor: [{ foo: "bar" }]
      });
    }).toThrow("$nor");
    expect(() => {
      parseSelector({
        baz: "cow",
        $nor: [{ foo: "bar" }]
      });
    }).toThrow("$nor");
    expect(() => {
      parseSelector({
        $fooBar: [{ foo: "bar" }]
      });
    }).toThrow("$fooBar");
    expect(() => {
      parseSelector({
        baz: "cow",
        $fooBar: [{ foo: "bar" }]
      });
    }).toThrow("$fooBar");
  });

  it("should throw exception when in encounters invalid field specs", () => {
    // Now handle some invalid selectors...
    expect(() =>
      parseSelector({
        foo: {
          $eq: "foo",
          bar: "baz"
        }
      })
    ).toThrow("$-operators");
  });

  it("should list all fields with all their operators", () => {
    expect(parseSelector({})).toEqual([]);
    expect(parseSelector({ foo: "bar" })).toEqual([
      {
        field: "foo",
        op: "$eq",
        value: "bar"
      }
    ]);

    expect(parseSelector({ foo: null })).toEqual([
      {
        field: "foo",
        op: "$eq",
        value: null
      }
    ]);

    expect(parseSelector({ foo: undefined })).toEqual([
      {
        field: "foo",
        op: "$eq",
        value: undefined
      }
    ]);

    expect(parseSelector({ foo: { $eq: "bar" } })).toEqual([
      {
        field: "foo",
        op: "$eq",
        value: "bar"
      }
    ]);

    expect(parseSelector({ foo: "bar", baz: "cow" })).toEqual([
      {
        field: "foo",
        op: "$eq",
        value: "bar"
      },
      {
        field: "baz",
        op: "$eq",
        value: "cow"
      }
    ]);

    expect(
      parseSelector({ foo: { $exists: true, $nin: ["baz", "cow"] } })
    ).toEqual([
      {
        field: "foo",
        op: "$exists",
        value: true
      },
      {
        field: "foo",
        op: "$nin",
        value: ["baz", "cow"]
      }
    ]);

    expect(parseSelector({ foo: { bar: "baz" } })).toEqual([
      {
        field: "foo",
        op: "$eq",
        value: { bar: "baz" }
      }
    ]);

    expect(parseSelector({ foo: new Date(2015, 3, 1) })).toEqual([
      {
        field: "foo",
        op: "$eq",
        value: new Date(2015, 3, 1)
      }
    ]);

    expect(parseSelector({ foo: {} })).toEqual([
      {
        field: "foo",
        op: "$eq",
        value: {}
      }
    ]);
  });
});

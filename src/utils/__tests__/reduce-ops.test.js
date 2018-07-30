import { deduplicateArray, valueIsEqual, reduceOps } from "../reduce-ops";

describe("reduceOps", () => {
  test("should consider equal numbers to be equal", () => {
    expect(valueIsEqual(2, 2)).toBeTruthy();
    expect(valueIsEqual(0, 0)).toBeTruthy();
    expect(valueIsEqual(-1, -1)).toBeTruthy();
    expect(valueIsEqual(1, 2)).toBeFalsy();
    expect(valueIsEqual(0, 1)).toBeFalsy();
    expect(valueIsEqual(-1, 1)).toBeFalsy();
    expect(valueIsEqual("1", 1)).toBeFalsy();
  });

  test("should consider equal strings to be equal", () => {
    expect(valueIsEqual("", "")).toBeTruthy();
    expect(valueIsEqual("Hello World", "Hello World")).toBeTruthy();
    expect(valueIsEqual("Hello World", "Hi")).toBeFalsy();
    expect(valueIsEqual("Hi", "hi")).toBeFalsy();
    expect(valueIsEqual("Hi", "")).toBeFalsy();
  });

  test("should consider equal dates to be equal", () => {
    expect(
      valueIsEqual(new Date(2015, 3, 1), new Date(2015, 3, 1))
    ).toBeTruthy();
    expect(
      valueIsEqual(new Date(2015, 3, 1), new Date(2018, 1, 9))
    ).toBeFalsy();
    expect(
      valueIsEqual(new Date(2015, 3, 1), new Date(2015, 3, 1).getTime())
    ).toBeFalsy();
    expect(
      valueIsEqual(new Date(2015, 3, 1).getTime(), new Date(2015, 3, 1))
    ).toBeFalsy();
  });

  test("should consider equal objects to be equal", () => {
    expect(valueIsEqual({}, {})).toBeTruthy();
    expect(valueIsEqual({ foo: "bar" }, { foo: "bar" })).toBeTruthy();
    expect(valueIsEqual({ foo: "bar" }, { foo: "baz" })).toBeFalsy();
    expect(
      valueIsEqual({ foo: new Date(2015, 3, 1) }, { foo: new Date(2015, 3, 1) })
    ).toBeTruthy();

    expect(valueIsEqual({ foo: "1" })).toBeFalsy();
    expect(valueIsEqual({ foo: 2 })).toBeFalsy();
  });

  test("should consider equal arrays to equal", () => {
    expect(valueIsEqual([], [])).toBeTruthy();
    expect(valueIsEqual(["foo", "bar"], ["foo", "bar"])).toBeTruthy();
    expect(valueIsEqual(["foo", "bar"], ["foo", "baz"])).toBeFalsy();
    expect(valueIsEqual(["foo", "bar"], ["bar", "foo"])).toBeFalsy();
    expect(valueIsEqual(["foo"], ["foo", "bar"])).toBeFalsy();
    expect(valueIsEqual(["foo", "bar"], ["foo"])).toBeFalsy();
    expect(
      valueIsEqual([new Date(2015, 3, 1)], [new Date(2015, 3, 1)])
    ).toBeTruthy();
    expect(
      valueIsEqual([new Date(2018, 1, 9)], [new Date(2015, 3, 1)])
    ).toBeFalsy();
    expect(valueIsEqual([{ foo: "bar" }], [{ foo: "bar" }])).toBeTruthy();
    expect(valueIsEqual([{ foo: "bar" }], [{ foo: "baz" }])).toBeFalsy();
  });

  test("should eliminate duplicated values", () => {
    expect(deduplicateArray([])).toEqual([]);
    expect(deduplicateArray([0])).toEqual([0]);
    expect(deduplicateArray([1, 2, 3, 3, 4])).toEqual([1, 2, 3, 4]);
    expect(deduplicateArray([3, 1, 2, 3, 3, 4])).toEqual([3, 1, 2, 4]);
    expect(deduplicateArray(["1", 1])).toEqual(["1", 1]);
    expect(deduplicateArray([{ foo: "bar" }, { foo: "bar" }])).toEqual([
      { foo: "bar" }
    ]);
  });

  test("should handle empty parsed selectors", () => {
    expect(reduceOps([])).toEqual([]);
  });

  test("should return the input when nothing can be reduced", () => {
    // Irreducible ops
    expect(reduceOps([{ field: "foo", op: "$exists", value: true }])).toEqual([
      {
        field: "foo",
        op: "$exists",
        value: true
      }
    ]);

    expect(reduceOps([{ field: "foo", op: "$exists", value: false }])).toEqual([
      {
        field: "foo",
        op: "$exists",
        value: false
      }
    ]);

    expect(reduceOps([{ field: "foo", op: "$candis", value: "bar" }])).toEqual([
      {
        field: "foo",
        op: "$candis",
        value: "bar"
      }
    ]);

    // Reducible ops:

    expect(reduceOps([{ field: "foo", op: "$in", value: ["bar"] }])).toEqual([
      { field: "foo", op: "$in", value: ["bar"] }
    ]);

    expect(reduceOps([{ field: "foo", op: "$lt", value: 5 }])).toEqual([
      { field: "foo", op: "$lt", value: 5 }
    ]);

    // incompatible ops:

    expect(
      reduceOps([
        { field: "foo", op: "$lt", value: 5 },
        { field: "foo", op: "$exists", value: true }
      ])
    ).toEqual([
      { field: "foo", op: "$lt", value: 5 },
      { field: "foo", op: "$exists", value: true }
    ]);
  });

  test("should combine $in statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$in",
          value: [1, 2, 3]
        },
        {
          field: "foo",
          op: "$in",
          value: [1, 2, 4, 5]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$in",
        value: [1, 2]
      }
    ]);

    expect(
      reduceOps([
        {
          field: "foo",
          op: "$in",
          value: [3]
        },
        {
          field: "foo",
          op: "$in",
          value: [1, 2, 4, 5]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$in",
        value: []
      }
    ]);

    expect(
      reduceOps([
        {
          field: "foo",
          op: "$in",
          value: [1, 2, 3, new Date(2015, 3, 1)]
        },
        {
          field: "foo",
          op: "$in",
          value: [1, 2, 4, new Date(2015, 3, 1)]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$in",
        value: [1, 2, new Date(2015, 3, 1)]
      }
    ]);
  });

  test("should combine $nin statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$nin",
          value: [1, 2, 3]
        },
        {
          field: "foo",
          op: "$nin",
          value: [1, 2, 4, 5]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$nin",
        value: [1, 2, 3, 4, 5]
      }
    ]);

    expect(
      reduceOps([
        {
          field: "foo",
          op: "$nin",
          value: [1, 2, 3, new Date(2015, 3, 1)]
        },
        {
          field: "foo",
          op: "$nin",
          value: [1, 2, 4, new Date(2015, 3, 1)]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$nin",
        value: [1, 2, 3, new Date(2015, 3, 1), 4]
      }
    ]);
  });

  test("should combine $eq statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$eq",
          value: 6
        },
        {
          field: "foo",
          op: "$eq",
          value: 4
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$in",
        value: []
      }
    ]);
  });

  test("should combine $eq statements with $in statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$eq",
          value: 6
        },
        {
          field: "foo",
          op: "$in",
          value: [1, 2, 4, 5]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$in",
        value: []
      }
    ]);
  });

  test("should combine $ne statements with $nin statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$ne",
          value: 6
        },
        {
          field: "foo",
          op: "$nin",
          value: [1, 2, 4, 5]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$nin",
        value: [6, 1, 2, 4, 5]
      }
    ]);
  });

  test("should combine $gt statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$gt",
          value: 6
        },
        {
          field: "foo",
          op: "$gt",
          value: 1
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$gt",
        value: 6
      }
    ]);
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$gt",
          value: 6
        },
        {
          field: "foo",
          op: "$gt",
          value: 8
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$gt",
        value: 8
      }
    ]);

    expect(
      reduceOps([
        {
          field: "foo",
          op: "$gt",
          value: new Date(2015, 3, 1)
        },
        {
          field: "foo",
          op: "$gt",
          value: new Date(2018, 1, 19)
        },
        {
          field: "foo",
          op: "$gt",
          value: new Date(2017, 1, 19)
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$gt",
        value: new Date(2018, 1, 19)
      }
    ]);

    expect(
      reduceOps([
        { field: "foo", op: "$gt", value: "a" },
        { field: "foo", op: "$gt", value: "b" }
      ])
    ).toEqual([
      { field: "foo", op: "$gt", value: "a" },
      { field: "foo", op: "$gt", value: "b" }
    ]);
  });

  test("should combine $gte statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$gte",
          value: 6
        },
        {
          field: "foo",
          op: "$gte",
          value: 1
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$gte",
        value: 6
      }
    ]);
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$gte",
          value: 6
        },
        {
          field: "foo",
          op: "$gte",
          value: 8
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$gte",
        value: 8
      }
    ]);

    expect(
      reduceOps([
        {
          field: "foo",
          op: "$gte",
          value: new Date(2015, 3, 1)
        },
        {
          field: "foo",
          op: "$gte",
          value: new Date(2018, 1, 19)
        },
        {
          field: "foo",
          op: "$gte",
          value: new Date(2017, 1, 19)
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$gte",
        value: new Date(2018, 1, 19)
      }
    ]);

    expect(
      reduceOps([
        { field: "foo", op: "$gte", value: "a" },
        { field: "foo", op: "$gte", value: "b" }
      ])
    ).toEqual([
      { field: "foo", op: "$gte", value: "a" },
      { field: "foo", op: "$gte", value: "b" }
    ]);
  });

  test("should combine $lt statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$lt",
          value: 6
        },
        {
          field: "foo",
          op: "$lt",
          value: 1
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$lt",
        value: 1
      }
    ]);
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$lt",
          value: 6
        },
        {
          field: "foo",
          op: "$lt",
          value: 8
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$lt",
        value: 6
      }
    ]);

    expect(
      reduceOps([
        {
          field: "foo",
          op: "$lt",
          value: new Date(2015, 3, 1)
        },
        {
          field: "foo",
          op: "$lt",
          value: new Date(2018, 1, 19)
        },
        {
          field: "foo",
          op: "$lt",
          value: new Date(2017, 1, 19)
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$lt",
        value: new Date(2015, 3, 1)
      }
    ]);

    expect(
      reduceOps([
        { field: "foo", op: "$lt", value: "a" },
        { field: "foo", op: "$lt", value: "b" }
      ])
    ).toEqual([
      { field: "foo", op: "$lt", value: "a" },
      { field: "foo", op: "$lt", value: "b" }
    ]);
  });

  test("should combine $lte statements", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$lte",
          value: 6
        },
        {
          field: "foo",
          op: "$lte",
          value: 1
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$lte",
        value: 1
      }
    ]);
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$lte",
          value: 6
        },
        {
          field: "foo",
          op: "$lte",
          value: 8
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$lte",
        value: 6
      }
    ]);

    expect(
      reduceOps([
        {
          field: "foo",
          op: "$lte",
          value: new Date(2015, 3, 1)
        },
        {
          field: "foo",
          op: "$lte",
          value: new Date(2018, 1, 19)
        },
        {
          field: "foo",
          op: "$lte",
          value: new Date(2017, 1, 19)
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$lte",
        value: new Date(2015, 3, 1)
      }
    ]);

    expect(
      reduceOps([
        { field: "foo", op: "$lte", value: "a" },
        { field: "foo", op: "$lte", value: "b" }
      ])
    ).toEqual([
      { field: "foo", op: "$lte", value: "a" },
      { field: "foo", op: "$lte", value: "b" }
    ]);
  });

  test("should maintain unknown ops", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$eq",
          value: "bar"
        },
        {
          field: "foo",
          op: "$unknownMongoOp",
          value: "candis"
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$in",
        value: ["bar"]
      },
      {
        field: "foo",
        op: "$unknownMongoOp",
        value: "candis"
      }
    ]);
  });

  test("should not merge different fields", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$in",
          value: [1, 2, 3]
        },
        {
          field: "bar",
          op: "$in",
          value: [1, 2, 4, 5]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$in",
        value: [1, 2, 3]
      },
      {
        field: "bar",
        op: "$in",
        value: [1, 2, 4, 5]
      }
    ]);
  });

  test("should handle arrays properly", () => {
    expect(
      reduceOps([
        {
          field: "foo",
          op: "$eq",
          value: ["bar"]
        },
        {
          field: "foo",
          op: "$in",
          value: ["baz", ["bar"]]
        }
      ])
    ).toEqual([
      {
        field: "foo",
        op: "$in",
        value: [["bar"]]
      }
    ]);
  });
});

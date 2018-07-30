import { compileSelector } from "../compile-selector";

describe("compileSelector", () => {
  it("should return an empty selector on an empty array", () => {
    expect(compileSelector([])).toEqual({});
  });

  it("should merge operators into a minimum amount of $and conditions", () => {
    expect(
      compileSelector([
        {
          field: "foo",
          op: "$gte",
          value: 0
        },

        {
          field: "foo",
          op: "$lt",
          value: 1
        }
      ])
    ).toEqual({
      foo: {
        $gte: 0,
        $lt: 1
      }
    });

    expect(
      compileSelector([
        {
          field: "foo",
          op: "$gte",
          value: 0
        },

        {
          field: "bar",
          op: "$lt",
          value: 1
        }
      ])
    ).toEqual({
      foo: {
        $gte: 0
      },
      bar: {
        $lt: 1
      }
    });

    expect(
      compileSelector([
        {
          field: "foo",
          op: "$ne",
          value: 0
        },

        {
          field: "foo",
          op: "$ne",
          value: 1
        }
      ])
    ).toEqual({
      $and: [
        {
          foo: { $ne: 0 }
        },
        {
          foo: { $ne: 1 }
        }
      ]
    });
    expect(
      compileSelector([
        {
          field: "foo",
          op: "$ne",
          value: 0
        },

        {
          field: "bar",
          op: "$ne",
          value: 1
        }
      ])
    ).toEqual({
      foo: { $ne: 0 },
      bar: { $ne: 1 }
    });
  });

  it("should replace explicit operators by implicit operators where possible", () => {
    expect(compileSelector([{ field: "foo", op: "$eq", value: 1 }])).toEqual({
      foo: 1
    });

    expect(compileSelector([{ field: "foo", op: "$in", value: [1] }])).toEqual({
      foo: 1
    });

    expect(
      compileSelector([
        { field: "foo", op: "$in", value: [1] },
        { field: "foo", op: "$gt", value: 1 }
      ])
    ).toEqual({
      foo: {
        $eq: 1,
        $gt: 1
      }
    });
  });

  it("should preserve comparisons to null", () => {
    expect(compileSelector([{ field: "foo", op: "$eq", value: null }])).toEqual(
      {
        foo: null
      }
    );

    expect(
      compileSelector([{ field: "foo", op: "$in", value: [null] }])
    ).toEqual({
      foo: null
    });

    expect(
      compileSelector([
        { field: "foo", op: "$in", value: [null] },
        { field: "foo", op: "$gt", value: null }
      ])
    ).toEqual({
      foo: {
        $eq: null,
        $gt: null
      }
    });
  });

  it("should preserve comparisons to undefined", () => {
    expect(
      compileSelector([{ field: "foo", op: "$eq", value: undefined }])
    ).toEqual({
      foo: undefined
    });

    expect(
      compileSelector([{ field: "foo", op: "$in", value: [undefined] }])
    ).toEqual({
      foo: undefined
    });

    expect(
      compileSelector([
        { field: "foo", op: "$in", value: [undefined] },
        { field: "foo", op: "$gt", value: undefined }
      ])
    ).toEqual({
      foo: {
        $eq: undefined,
        $gt: undefined
      }
    });
  });
});

import { simplify } from "../simplify";

describe("simplify", () => {
  test("should be able to handle an empty selector", () => {
    expect(simplify({})).toEqual({});
  });

  test("should keep empty $and, $or and $nor clauses", () => {
    expect(simplify({ $and: [] })).toEqual({ $and: [] });
    expect(simplify({ $or: [] })).toEqual({ $or: [] });
    expect(simplify({ $nor: [] })).toEqual({ $nor: [] });
  });

  test("should simplify queries", () => {
    expect(
      simplify({
        $and: [
          {
            ownerId: { $in: ["a", "b", "c", "d"] }
          },
          {
            $and: [
              {
                ownerId: "c",
                $or: [{ processedAt: { $exists: false } }, { type: "Invoice" }]
              }
            ]
          }
        ]
      })
    ).toEqual({
      $or: [
        {
          ownerId: "c",
          processedAt: { $exists: false }
        },
        {
          ownerId: "c",
          type: "Invoice"
        }
      ]
    });
    expect(
      simplify({
        $and: [
          {
            ownerId: { $in: ["a", "b", "c", "d"] }
          },
          {
            $and: [
              {
                ownerId: "x",
                $or: [{ processedAt: { $exists: false } }, { type: "Invoice" }]
              }
            ]
          }
        ]
      })
    ).toEqual({
      $or: [
        {
          ownerId: { $in: [] },
          processedAt: { $exists: false }
        },
        {
          ownerId: { $in: [] },
          type: "Invoice"
        }
      ]
    });
  });
});

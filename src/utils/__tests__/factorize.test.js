import { factorize } from "../factorize";

describe("factorize", () => {
  it("should apply distributive law to factorize queries", () => {
    expect(factorize({})).toEqual({});

    expect(
      factorize({
        name: "a",
        $or: [{ name: "b" }]
      })
    ).toEqual(
      {
        $and: [{ name: "a" }, { name: "b" }]
      },
      "a ( b ) = a b"
    );

    expect(
      factorize({
        $and: [{ name: "a" }, { name: "b" }],

        $or: [{ name: "c" }, { name: "d" }]
      })
    ).toEqual(
      {
        $or: [
          {
            $and: [{ name: "a" }, { name: "b" }, { name: "c" }]
          },
          {
            $and: [{ name: "a" }, { name: "b" }, { name: "d" }]
          }
        ]
      },
      "(a b) (c + d) = (a b c) + (a b d )"
    );

    expect(
      factorize({
        $and: [{ name: "a" }, { name: "b" }],

        $or: [{ name: "c" }, { name: "d" }],

        name: "e"
      })
    ).toEqual(
      {
        $or: [
          {
            $and: [{ name: "a" }, { name: "b" }, { name: "e" }, { name: "c" }]
          },
          {
            $and: [{ name: "a" }, { name: "b" }, { name: "e" }, { name: "d" }]
          }
        ]
      },
      "e (a b) (c + d) = (e a b c) + (e a b d)"
    );

    expect(
      factorize({
        $and: [
          {
            $or: [{ name: "a" }, { name: "b" }]
          },
          {
            $or: [{ name: "c" }, { name: "d" }]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          {
            $and: [{ name: "c" }, { name: "a" }]
          },
          {
            $and: [{ name: "c" }, { name: "b" }]
          },
          {
            $and: [{ name: "d" }, { name: "a" }]
          },
          {
            $and: [{ name: "d" }, { name: "b" }]
          }
        ]
      },
      "(a + b)(c + d) = ac + bd + ad + bc"
    );

    expect(
      factorize({
        $and: [
          { name: "a" },
          {
            $and: [{ name: "e" }, { name: "f" }],

            $or: [{ name: "g" }, { name: "h" }]
          }
        ],

        $or: [{ name: "c" }, { name: "d" }]
      })
    ).toEqual(
      {
        $or: [
          {
            $and: [
              { name: "c" },
              { name: "a" },
              { name: "e" },
              { name: "f" },
              { name: "g" }
            ]
          },
          {
            $and: [
              { name: "c" },
              { name: "a" },
              { name: "e" },
              { name: "f" },
              { name: "h" }
            ]
          },
          {
            $and: [
              { name: "d" },
              { name: "a" },
              { name: "e" },
              { name: "f" },
              { name: "g" }
            ]
          },
          {
            $and: [
              { name: "d" },
              { name: "a" },
              { name: "e" },
              { name: "f" },
              { name: "h" }
            ]
          }
        ]
      },
      "(a ( (e f) (g + h))) (c + d) = (aefgc + aefhc + aefgd + aefhd)"
    );

    expect(
      factorize({
        name: "a",
        $and: [
          {
            $or: [{ name: "b" }, { name: "c" }]
          },
          {
            $or: [{ name: "d" }, { name: "e" }]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          {
            $and: [{ name: "d" }, { name: "a" }, { name: "b" }]
          },
          {
            $and: [{ name: "d" }, { name: "a" }, { name: "c" }]
          },
          {
            $and: [{ name: "e" }, { name: "a" }, { name: "b" }]
          },
          {
            $and: [{ name: "e" }, { name: "a" }, { name: "c" }]
          }
        ]
      },
      "a (b + c) (d + e) = (abd + abe + acd + ace)"
    );

    expect(
      factorize({
        $and: [
          { name: "a" },
          {
            $or: [{ name: "b" }, { name: "c" }]
          },
          {
            $or: [{ name: "d" }, { name: "e" }]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          {
            $and: [{ name: "d" }, { name: "a" }, { name: "b" }]
          },
          {
            $and: [{ name: "d" }, { name: "a" }, { name: "c" }]
          },
          {
            $and: [{ name: "e" }, { name: "a" }, { name: "b" }]
          },
          {
            $and: [{ name: "e" }, { name: "a" }, { name: "c" }]
          }
        ]
      },
      "( a ) (b + c) (d + e) = (abd + abe + acd + ace)"
    );

    expect(
      factorize({
        $and: [
          {
            name: "a",
            $or: [{ name: "b" }, { name: "c" }]
          },
          {
            $or: [{ name: "d" }, { name: "e" }]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          {
            $and: [{ name: "d" }, { name: "a" }, { name: "b" }]
          },
          {
            $and: [{ name: "d" }, { name: "a" }, { name: "c" }]
          },
          {
            $and: [{ name: "e" }, { name: "a" }, { name: "b" }]
          },
          {
            $and: [{ name: "e" }, { name: "a" }, { name: "c" }]
          }
        ]
      },
      "( a (b + c) ) (d + e) = (abd + abe + acd + ace)"
    );

    expect(
      factorize({
        name: "x",
        $and: [
          {
            name: "a",
            $or: [{ name: "b" }, { name: "c" }]
          },
          {
            $or: [{ name: "d" }, { name: "e" }]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          {
            $and: [{ name: "d" }, { name: "a" }, { name: "x" }, { name: "b" }]
          },
          {
            $and: [{ name: "d" }, { name: "a" }, { name: "x" }, { name: "c" }]
          },
          {
            $and: [{ name: "e" }, { name: "a" }, { name: "x" }, { name: "b" }]
          },
          {
            $and: [{ name: "e" }, { name: "a" }, { name: "x" }, { name: "c" }]
          }
        ]
      },
      "x ( a (b + c) ) (d + e) = (xabd + xabe + xacd + xace)"
    );
  });

  it("should eliminate empty selectors in an $and clause", () => {
    expect(factorize({ $and: [{}] })).toEqual({});
    expect(factorize({ $and: [{}], $or: [] })).toEqual({ $or: [] });

    expect(factorize({ $and: [{ foo: "bar" }, {}] })).toEqual({ foo: "bar" });
    expect(factorize({ $and: [{ foo: "bar" }, {}, { baz: "cow" }] })).toEqual({
      $and: [{ foo: "bar" }, { baz: "cow" }]
    });

    expect(
      factorize({ $and: [{ foo: "bar" }, { $and: [] }, { baz: "cow" }] })
    ).toEqual({
      $and: [{ foo: "bar" }, { $and: [] }, { baz: "cow" }]
    });

    expect(
      factorize({
        $and: [{ foo: "bar", $or: [{ $and: [] }] }, { baz: "cow" }]
      })
    ).toEqual({
      $and: [{ foo: "bar" }, { baz: "cow" }, { $and: [] }]
    });
  });

  it("should not eliminate empty selectors in an $or clause", () => {
    expect(factorize({ $or: [{}] })).toEqual({});
    expect(factorize({ $or: [{ foo: "bar" }, {}] })).toEqual({
      $or: [{ foo: "bar" }, {}]
    });
    expect(factorize({ $or: [{ foo: "bar" }, {}, { baz: "cow" }] })).toEqual({
      $or: [{ foo: "bar" }, {}, { baz: "cow" }]
    });

    expect(
      factorize({ $or: [{ foo: "bar" }, { $or: [] }, { baz: "cow" }] })
    ).toEqual({
      $or: [{ foo: "bar" }, { $or: [] }, { baz: "cow" }]
    });
  });
});

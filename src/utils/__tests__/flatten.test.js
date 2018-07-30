import { flatten } from "../flatten";

describe("flatten", () => {
  test("should root single-element $and and $or clauses", () => {
    expect(flatten({ $and: [{ foo: "bar" }] })).toEqual({ foo: "bar" });
    expect(flatten({ $or: [{ foo: "bar" }] })).toEqual({ foo: "bar" });
    expect(flatten({ $and: [{ foo: "bar" }], baz: "cow" })).toEqual({
      $and: [{ foo: "bar" }],
      baz: "cow"
    });

    expect(flatten({ $and: [{ foo: "bar" }], $or: [{ baz: "cow" }] })).toEqual({
      foo: "bar",
      $or: [{ baz: "cow" }]
    });

    // Not not apply on $nor
    expect(flatten({ $nor: [{ foo: "bar" }] })).toEqual({
      $nor: [{ foo: "bar" }]
    });
  });

  test("should eliminate empty selectors in an $and clause", () => {
    expect(flatten({ $and: [{}] })).toEqual({});

    expect(flatten({ $and: [{ foo: "bar" }, {}] })).toEqual({ foo: "bar" });
    expect(flatten({ $and: [{ foo: "bar" }, {}, { baz: "cow" }] })).toEqual({
      $and: [{ foo: "bar" }, { baz: "cow" }]
    });

    expect(
      flatten({ $and: [{ foo: "bar" }, { $and: [] }, { baz: "cow" }] })
    ).toEqual({
      $and: [{ foo: "bar" }, { $and: [] }, { baz: "cow" }]
    });
  });

  test("should not eliminate empty selectors in an $or clause", () => {
    expect(flatten({ $or: [{}] })).toEqual({});
    expect(flatten({ $or: [{ foo: "bar" }, {}] })).toEqual({
      $or: [{ foo: "bar" }, {}]
    });
    expect(flatten({ $or: [{ foo: "bar" }, {}, { baz: "cow" }] })).toEqual({
      $or: [{ foo: "bar" }, {}, { baz: "cow" }]
    });

    expect(
      flatten({ $or: [{ foo: "bar" }, { $or: [] }, { baz: "cow" }] })
    ).toEqual({
      $or: [{ foo: "bar" }, { $or: [] }, { baz: "cow" }]
    });
  });

  test("should not eliminate empty selectors in an $nor clause", () => {
    expect(flatten({ $nor: [{}] })).toEqual({ $nor: [{}] });
    expect(flatten({ $nor: [{ foo: "bar" }, {}] })).toEqual({
      $nor: [{ foo: "bar" }, {}]
    });
    expect(flatten({ $nor: [{ foo: "bar" }, {}, { baz: "cow" }] })).toEqual({
      $nor: [{ foo: "bar" }, {}, { baz: "cow" }]
    });

    expect(
      flatten({ $nor: [{ foo: "bar" }, { $nor: [] }, { baz: "cow" }] })
    ).toEqual({
      $nor: [{ foo: "bar" }, { $nor: [] }, { baz: "cow" }]
    });
  });

  test("should apply associative law in $and clauses", () => {
    expect(
      flatten({
        $and: [
          {
            foo: "bar",
            $and: [
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $and: [
          {
            foo: "bar"
          },

          {
            foo: { $in: ["baz"] }
          }
        ]
      },
      "a ( b ) = a b"
    );

    expect(
      flatten({
        $and: [
          {
            foo: "bar",
            $and: [
              {
                foo: "cow"
              },
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $and: [
          { foo: "bar" },
          {
            foo: "cow"
          },
          {
            foo: { $in: ["baz"] }
          }
        ]
      },

      "a ( b c ) = a b c"
    );

    expect(
      flatten({
        $and: [
          { name: "a" },
          { $and: [{ name: "b" }, { $and: [{ name: "c" }, { name: "d" }] }] }
        ]
      })
    ).toEqual(
      {
        $and: [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }]
      },
      "a ( b ( c d ) ) = a b c d"
    );
  });

  test("should apply associative law in $or clauses", () => {
    expect(
      flatten({
        $or: [
          {
            foo: "bar"
          },
          {
            $or: [
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          {
            foo: "bar"
          },
          {
            foo: { $in: ["baz"] }
          }
        ]
      },
      "a + ( b ) = a + b"
    );

    expect(
      flatten({
        $or: [
          {
            foo: "bar"
          },
          {
            foo: "cow",
            $or: [
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          {
            foo: "bar"
          },
          {
            foo: "cow",
            $or: [
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      },
      "a + ( b d ) = a + b d"
    );

    expect(
      flatten({
        $or: [
          {
            foo: "bar"
          },
          {
            $or: [
              { foo: "cow" },
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          {
            foo: "bar"
          },

          {
            foo: "cow"
          },
          {
            foo: { $in: ["baz"] }
          }
        ]
      },
      "a + ( b + c ) = a + b + c"
    );

    expect(
      flatten({
        $or: [
          { name: "a" },
          { $or: [{ name: "b" }, { $or: [{ name: "c" }, { name: "d" }] }] }
        ]
      })
    ).toEqual(
      {
        $or: [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }]
      },
      "a + ( b + ( c + d ) ) = a + b + c + d"
    );
  });

  test("should apply associative law in $nor clauses", () => {
    expect(
      flatten({
        $nor: [
          {
            foo: "bar"
          },
          {
            $nor: [
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $nor: [
          {
            foo: "bar"
          },

          {
            foo: { $in: ["baz"] }
          }
        ]
      },
      "|a + | b || = |a + b|"
    );

    expect(
      flatten({
        $nor: [
          {
            foo: "bar"
          },
          {
            foo: "cow",
            $nor: [
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $nor: [
          {
            foo: "bar"
          },
          {
            foo: "cow",
            $nor: [
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      },

      "|a + | b |c| | | = | a + b |c| |"
    );

    expect(
      flatten({
        $nor: [
          {
            foo: "bar"
          },
          {
            $nor: [
              { foo: "cow" },
              {
                foo: { $in: ["baz"] }
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $nor: [
          {
            foo: "bar"
          },

          {
            foo: "cow"
          },
          {
            foo: { $in: ["baz"] }
          }
        ]
      },
      "|a + | b + c || = |a + b + c|"
    );

    expect(
      flatten({
        $nor: [
          { name: "a" },
          { $nor: [{ name: "b" }, { $nor: [{ name: "c" }, { name: "d" }] }] }
        ]
      })
    ).toEqual(
      {
        $nor: [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }]
      },
      "|a + | b + | c + d | | = |a + b + c + d|"
    );
  });

  test("should apply associative law in $or clauses that are nested within $and clauses", () => {
    expect(
      flatten({
        $and: [
          { name: "a" },
          {
            $and: [
              { name: "b" },
              {
                $and: [
                  { name: "c" },
                  {
                    name: "d",
                    $or: [
                      { name: "e" },
                      {
                        $or: [
                          { name: "f" },
                          { $or: [{ name: "g" }, { name: "h" }] }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $and: [
          { name: "a" },
          { name: "b" },
          { name: "c" },
          {
            name: "d",
            $or: [{ name: "e" }, { name: "f" }, { name: "g" }, { name: "h" }]
          }
        ]
      },
      "a ( b ( c ( d ( e + ( f + ( g + h )))))) = a b c d ( e + f + g + h )"
    );

    expect(
      flatten({
        $and: [
          { name: "a" },
          {
            $and: [
              { name: "b" },
              {
                $and: [
                  { name: "c" },
                  {
                    $or: [
                      { name: "e" },
                      {
                        $or: [
                          { name: "f" },
                          { $or: [{ name: "g" }, { name: "h" }] }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $and: [
          { name: "a" },
          { name: "b" },
          { name: "c" },
          {
            $or: [{ name: "e" }, { name: "f" }, { name: "g" }, { name: "h" }]
          }
        ]
      },
      "a ( b ( c ( e + ( f + ( g + h )))))) = a b c ( e + f + g + h )"
    );
  });

  test("should apply associative law in $and clauses that are nested within $or clauses", () => {
    expect(
      flatten({
        $or: [
          { name: "a" },
          {
            $or: [
              { name: "b" },
              {
                $or: [
                  { name: "c" },
                  {
                    $and: [
                      { name: "e" },
                      {
                        $and: [
                          { name: "f" },
                          { $and: [{ name: "g" }, { name: "h" }] }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      })
    ).toEqual(
      {
        $or: [
          { name: "a" },
          { name: "b" },
          { name: "c" },
          {
            $and: [{ name: "e" }, { name: "f" }, { name: "g" }, { name: "h" }]
          }
        ]
      },
      "a + ( b + ( c + ( e ( f ( g h )))))) = a + b + c + e f g h"
    );
  });

  it("should handle nested logical operators correctly", () => {
    expect(
      flatten({
        $and: [
          { $or: [{ name: "a" }, { name: "b" }] },
          { $or: [{ name: "c" }] }
        ]
      })
    ).toEqual(
      {
        $and: [{ $or: [{ name: "a" }, { name: "b" }] }, { name: "c" }]
      },
      "c(a + b) = c(a + b)"
    );

    expect(
      flatten({
        $and: [
          { $or: [{ name: "a" }, { name: "b" }] },
          { $or: [{ name: "c" }, { name: "d" }] }
        ]
      })
    ).toEqual(
      // Distributive law is not applied, so this selector does not flatten:
      {
        $and: [
          { $or: [{ name: "a" }, { name: "b" }] },
          { $or: [{ name: "c" }, { name: "d" }] }
        ]
      },
      "(a + b)(c + d) = (a + b)(c + d)"
    );
  });
});

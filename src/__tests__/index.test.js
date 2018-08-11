import { factorize, simplify } from "../index";

describe("package exports", () => {
  test("should export factorize", () => {
    expect(factorize).toBeDefined();
  });

  test("should export simplify", () => {
    expect(simplify).toBeDefined();
  });
});

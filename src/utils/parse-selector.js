// @flow

function isDollarOp(key: string): boolean {
  return key[0] === "$";
}

export function parseSelector(selector: Object) {
  return Object.entries(selector).reduce((ops, [field, value]) => {
    if (isDollarOp(field)) {
      // This low level function cannot possible describe selectors that contain
      // things like an $and clause. These should be stripped before passing it
      // on for parsing. The individual selectors that are contained in an $and
      // clause can be parsed separately. This will keep the data-structure of
      // the return value simple.
      throw new Error(
        `Complex selectors with a ${field} clause cannot be parsed.`
      );
    }

    if (
      typeof value !== "object" ||
      // typeof null === 'object', but should be treated as a plain value here
      value === null ||
      Array.isArray(value) ||
      !Object.keys(value).some(isDollarOp)
    ) {
      ops.push({
        field,
        op: "$eq",
        value
      });
    } else if (Object.keys(value).every(isDollarOp)) {
      ops.push(
        ...Object.entries(value).map(([op, value]) => ({
          field,
          op,
          value
        }))
      );
    } else {
      throw new Error(
        "Cannot mix $-operators with field values in sub-selector"
      );
    }
    return ops;
  }, []);
}

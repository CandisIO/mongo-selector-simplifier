// @flow

import { parseSelector } from "./parse-selector";
import type { MongoQuery } from "./types";

function flattenArray(arr: Array<Array<any>>): Array<any> {
  return arr.reduce((acc, arr) => [...acc, ...arr], []);
}

type CompareValuesFunction = (a: any, b: any) => boolean;

function arrayCompare(
  a: any,
  b: any,
  compareValues: CompareValuesFunction
): boolean {
  return a.length === b.length && a.every((a, i) => compareValues(a, b[i]));
}

function objCompare(a, b, compareValues): boolean {
  return (
    Object.keys(a).length === Object.keys(b).length &&
    Object.entries(a).every(([key, value]) => compareValues(value, b[key]))
  );
}

export function valueIsEqual(a: any, b: any): boolean {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return arrayCompare(a, b, valueIsEqual);
  }

  if (typeof a === "object" && typeof b === "object") {
    return objCompare(a, b, valueIsEqual);
  }

  return a === b;
}

function intersectArrays(a, ...more) {
  let b;

  while ((b = more.shift())) {
    a = deduplicateArray([
      ...a.filter(a => b.some(valueIsEqual.bind(this, a))),
      ...b.filter(b => a.some(valueIsEqual.bind(this, b)))
    ]);
  }

  return a;
}

export function deduplicateArray(array: Array<any>): Array<any> {
  const seen: Array<any> = [];

  return array.filter(value => {
    const isDuplicate = seen.some(valueIsEqual.bind(this, value));
    seen.push(value);
    return !isDuplicate;
  });
}

function getType(value: any): string {
  return value instanceof Date ? "date" : typeof value;
}

function groupTypes(values: Array<any>): Object {
  return values.reduce((acc, value) => {
    const type = getType(value);
    if (acc[type]) {
      acc[type].push(value);
    } else {
      acc[type] = [value];
    }

    return acc;
  }, {});
}

function max(values: Array<any>): any {
  return values.reduce((a, b) => (a > b ? a : b));
}

function min(values: Array<any>): any {
  return values.reduce((a, b) => (a < b ? a : b));
}

function mergeComparators(
  comparator: string,
  values: Array<any>,
  pick: (Array<any>) => any
) {
  const { date, number, ...other } = groupTypes(values);

  // $FlowFixMe see facebook/flow/issues/2174
  values = flattenArray(Object.values(other)).map((value: any) => ({
    [comparator]: value
  }));

  date &&
    values.push({
      [comparator]: pick(date)
    });

  number &&
    values.push({
      [comparator]: pick(number)
    });

  return values;
}

export const mergeValues = {
  $eq(values: Array<any>) {
    return [{ $in: values.length > 1 ? [] : values }];
  },

  $ne(values: Array<any>) {
    return [{ $nin: values }];
  },

  $gt(values: Array<any>) {
    return mergeComparators("$gt", values, max);
  },

  $gte(values: Array<any>) {
    return mergeComparators("$gte", values, max);
  },

  $lt(values: Array<any>) {
    return mergeComparators("$lt", values, min);
  },

  $lte(values: Array<any>) {
    return mergeComparators("$lte", values, min);
  },

  $in(values: Array<any>) {
    return [{ $in: intersectArrays(...values) }];
  },

  $nin(value: Array<any>) {
    return [{ $nin: deduplicateArray(flattenArray(value)) }];
  }
};

function reduceFieldOps(field: string, ops: Array<any>) {
  const irreducibleOps = ops.filter(({ op }) => !mergeValues[op]);
  let reducibleOps = ops.filter(({ op }) => mergeValues[op]);

  // Run two loops so that different ops can convert ops from a previous run.
  for (let i = 0; i !== 2; i++) {
    const selectors = Object.entries(mergeValues).reduce(
      (selectors, [opName, merge]) => {
        const values = deduplicateArray(
          reducibleOps
            .filter(({ op }) => op === opName)
            .map(({ value }) => value)
        );

        if (values.length > 0) {
          // $FlowFixMe see facebook/flow/issues/2174
          selectors.push(...merge(values).map(value => ({ [field]: value })));
        }
        return selectors;
      },
      ([]: Array<MongoQuery>)
    );

    reducibleOps = flattenArray(selectors.map(parseSelector));
  }

  return [...reducibleOps, ...irreducibleOps].map(op => ({ field, ...op }));
}

export function reduceOps(
  parsedSelector: Array<{ field: string, op: string, value: Object }>
) {
  // Group parsed ops by field:
  const fieldMap = parsedSelector.reduce((fieldMap, { field, ...op }) => {
    if (fieldMap[field]) {
      fieldMap[field].push(op);
    } else {
      fieldMap[field] = [op];
    }
    return fieldMap;
  }, {});

  return Object.entries(fieldMap).reduce((acc, [field, ops]) => {
    // $FlowFixMe see facebook/flow/issues/2174
    acc.push(...reduceFieldOps(field, ops));
    return acc;
  }, []);
}

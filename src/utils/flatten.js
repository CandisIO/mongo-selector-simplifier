// @flow

import type { MongoQuery } from "./types";

function reduceAnd($and: Array<MongoQuery>, selector: MongoQuery): MongoQuery {
  if ($and.length === 0) {
    Object.assign(selector, { $and });
  } else {
    $and = $and
      .reduce((acc, { $and, ...selector }) => {
        acc.push((selector: Object), ...($and || []));
        if ($and && $and.length === 0) {
          acc.push({ $and });
        }

        return acc;
      }, ([]: Array<MongoQuery>))
      .filter(selector => Object.keys(selector).length > 0);

    // Root the $and operator if it only has one clause.
    if ($and.length === 1 && Object.keys(selector).length === 0) {
      [selector] = $and;
    } else if ($and.length > 0) {
      Object.assign(selector, { $and });
    }
  }

  return selector;
}

function reduceOr($or: Array<MongoQuery>, selector: MongoQuery): MongoQuery {
  if ($or.length === 0) {
    Object.assign(selector, { $or });
  } else {
    $or = $or.reduce((acc, { $or, ...selector }) => {
      if (Object.keys(selector).length > 0) {
        if ($or) {
          Object.assign((selector: Object), { $or });
        }
        acc.push((selector: Object));
      } else if ($or) {
        if ($or.length > 0) {
          acc.push(...$or);
        } else {
          // Keep empty array untouched.
          acc.push({ $or });
        }
      } else {
        acc.push({});
      }

      return acc;
    }, ([]: Array<MongoQuery>));

    // Root the $or operator if it only has one clause.
    if ($or.length === 1 && Object.keys(selector).length === 0) {
      [selector] = $or;
    } else if ($or.length > 0) {
      Object.assign(selector, { $or });
    }
  }

  return selector;
}

function reduceNor($nor: Array<MongoQuery>, selector: MongoQuery): Object {
  $nor = $nor.reduce((acc, { $nor, ...selector }) => {
    if (Object.keys(selector).length > 0) {
      if ($nor) {
        Object.assign((selector: Object), { $nor });
      }
      acc.push((selector: Object));
    } else if ($nor) {
      if ($nor.length > 0) {
        acc.push(...$nor);
      } else {
        // Keep empty array untouched.
        acc.push({ $nor });
      }
    } else {
      acc.push({});
    }
    return acc;
  }, ([]: Array<MongoQuery>));

  // Do not root the $nor clause as that would incorrectly loose the negation
  return Object.assign(selector, { $nor });
}

/** Uses the associative law to perform deep-level algebraic nesting reductions
 * of logical mongo operators.
 */

export function flatten({
  $and,
  $or,
  $nor,
  ...selector
}: MongoQuery): MongoQuery {
  // IMPORTANT Mongo treats empty arrays for logical operators as an error.
  // This error must not be eliminated, by clearing the empty arrays.
  // Unfortunately this requirement adds a great deal of complexity.
  if ($and) {
    selector = reduceAnd($and.map(flatten), (selector: Object));
  }
  if ($or) {
    selector = reduceOr($or.map(flatten), (selector: Object));
  }
  if ($nor) {
    selector = reduceNor($nor.map(flatten), (selector: Object));
  }

  return (selector: Object);
}

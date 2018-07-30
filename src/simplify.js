// @flow

import { factorize } from "./utils/factorize";
import { parseSelector } from "./utils/parse-selector";
import { compileSelector } from "./utils/compile-selector";
import { flatten } from "./utils/flatten";
import { reduceOps } from "./utils/reduce-ops";
import type { MongoQuery } from "./utils/types";

export function simplify(selector: MongoQuery): MongoQuery {
  let { $or, $and, $nor, ...more } = factorize(flatten(selector));

  const ops = [...($and || []), more].reduce((acc, selector) => {
    acc.push(...parseSelector(selector));
    return acc;
  }, []);

  if ($and && $and.length === 0) {
    $and = [{ $and }];
  } else {
    $and = [];
  }

  $and.push({ ...compileSelector(reduceOps(ops)) });

  selector = { $and };

  $or && Object.assign((selector: MongoQuery), { $or: $or.map(simplify) });
  $nor && Object.assign((selector: MongoQuery), { $nor: $nor.map(simplify) });

  return flatten(selector);
}

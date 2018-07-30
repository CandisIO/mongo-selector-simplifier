// @flow

import { flatten } from "./flatten";
import type { MongoQuery } from "./types";

/** Applies the distributive law to perform factorizations of logical mongo
 * operators in order to maximize index usage.
 */

export function factorize({ $and, ...selector }: MongoQuery) {
  // check($and, Match.Optional([Object]));
  // Performing this conversion:
  // A ( B + C ) => AB + AC
  // (A + B) ( C + D ) => AC + AD + BC + BD

  // TODO: add $nor factorization based on de Morgen's Theorem:
  // | A + B | | C + D | => | A B C D |

  if ($and && $and.length === 0) {
    // Empty $and arrays are very special, because the mongodb driver treats
    // them as erroneous.
    $and = [{ $and }];
  }

  if (!$and) {
    $and = [];
  }

  if (Object.keys(selector).length > 0) {
    $and = [...$and, (selector: Object)];
  }

  // Find $or clauses and separate them from the rest
  const orClauses: Array<Array<MongoQuery>> = [];

  $and = $and
    .map(({ $or, ...selector }: { $or?: Array<MongoQuery> }) => {
      if ($or) {
        orClauses.push($or);
      }

      return (selector: Object);
    })
    // Eliminate empty selectors (select all)
    .filter(selector => Object.keys(selector).length > 0);

  return flatten(
    orClauses.reduce(
      (acc, $or) =>
        flatten({
          $or: $or.map(selector => ({ $and: [acc, selector] })).map(factorize)
        }),
      $and.length > 0 ? { $and } : {}
    )
  );
}

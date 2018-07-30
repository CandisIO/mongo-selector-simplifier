// @flow

import { flatten } from "./flatten";

function simplifyValue(data: Object): Object {
  // Convert:
  // { $in: [0] } to { $eq: 0 }
  // { $eq: 0 } to 0
  // Preserve null and undefined values
  let { $in, $eq, $ne, $nin, ...value } = data;

  let hasEq = data.hasOwnProperty("$eq");
  let hasNe = data.hasOwnProperty("$ne");

  if (!hasEq && $in && $in.length === 1) {
    [$eq] = $in;
    hasEq = true;
  } else if ($in) {
    Object.assign(value, { $in });
  }

  if (!hasNe && $nin && $nin.length === 1) {
    [$ne] = $nin;
    hasNe = true;
  } else if ($nin) {
    Object.assign(value, { $nin });
  }

  if (hasEq)
    if (!hasNe && Object.keys(value).length > 0) {
      return Object.assign(value, { $eq });
    } else {
      return $eq;
    }

  if (hasNe) {
    Object.assign(value, { $ne });
  }

  return value;
}

export function compileSelector(
  ops: Array<{ field: string, op: string, value: Object }>
) {
  let selector = {};

  const $and: Array<Object> = [selector];

  ops.forEach(({ field, op, value }) => {
    if (!selector[field]) {
      selector[field] = {};
    }

    if (op in selector[field]) {
      selector = { [field]: { [op]: value } };
      $and.push(selector);
    } else {
      selector[field][op] = value;
    }
  });

  return flatten({
    $and: $and.map(selector =>
      Object.assign(
        {},
        ...Object.entries(selector).map(([field, value]) => ({
          // $FlowFixMe see facebook/flow/issues/2174
          [field]: simplifyValue(value)
        }))
      )
    )
  });
}

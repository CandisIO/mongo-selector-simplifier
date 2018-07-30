# Mongo Selector Simplifier

Reduce MongoDB selector query complexity using the commutative, associative and
distributive laws by de-seperating nested clauses. The output can often times
help MongoDB's query planner to chose the best index.

## Install

```
npm install --save @candis.io/mongo-query-simplifier
```

or

```
yarn add @candis.io/mongo-query-simplifier
```

## Usage

```js
import { simplify } from "@candis/mongo-query-simplifier";

const selector = {
  $and: [
    { name: { $in: ["Rey", "Leia Organa", "Padmé Amidala", "Jyn Erso"] } },
    { name: "Rey" }
  ],
  gender: "Female"
};

const simplifiedSelector = simplify(selector); // outputs { gender: 'Female', 'name': 'Rey' }
```

## Credit

Original work by @gsuess.

## License

`mongo-query-simplifier` is [MIT licensed](./LICENSE).

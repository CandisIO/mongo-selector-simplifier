# Mongo Selector Simplifier

Reduce MongoDB selector query complexity using the commutative, associative and
distributive laws by de-seperating nested clauses. The output can often times
help MongoDB's query planner to chose the best index.

## Install

```
npm install --save @candis.io/mongo-selector-simplifier
```

or

```
yarn add @candis.io/mongo-selector-simplifier
```

## Usage

```js
import { simplify } from "@candis/mongo-selector-simplifier";

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

`mongo-selector-simplifier` is [MIT licensed](./LICENSE).
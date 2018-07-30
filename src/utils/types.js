// @flow

export type MongoQuery = {
  $and?: Array<MongoQuery>,
  $nor?: Array<MongoQuery>,
  $or?: Array<MongoQuery>,
  [string]: any
};

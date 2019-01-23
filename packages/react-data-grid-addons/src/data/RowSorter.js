import { isImmutableCollection } from 'common/utils';

const getMixedTypeValueRetriever = (isImmutable) => {
  let retObj = {};
  const retriever = (item, key) => {
    if(item[key] && item[key].sortValue) {
      return item[key].sortValue
    }
    return item[key];
  };
  const immutableRetriever =  (immutable, key) => { return immutable.get(key); };

  retObj.getValue = isImmutable ? immutableRetriever : retriever;

  return retObj;
}

export const comparer = (a, b) => {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  }
  return 0;
};

const sortRows = (rows, sortColumn, sortDirection) => {
  const retriever = getMixedTypeValueRetriever(isImmutableCollection(rows));
  const sortDirectionSign = sortDirection === 'ASC' ? 1 : -1;
  const rowComparer = (a, b) => {
    return sortDirectionSign * comparer(retriever.getValue(a, sortColumn), retriever.getValue(b, sortColumn));
  };
  if (sortDirection === 'NONE') {
    return rows;
  }
  return rows.slice().sort(rowComparer);
};

export default sortRows;



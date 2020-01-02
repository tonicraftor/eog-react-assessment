
export enum QueryType {
  QUERY_ALL,
  QUERY_LAST
}

export type QueryObj = {
  metricName: string,
  queryType: QueryType,
  after: number,
  before: number
}


export default class QueryQueue {
  queryArr: QueryObj[] = [];

  enqueue = (queryObj: QueryObj) => {
    let newqq = new QueryQueue();
    newqq.queryArr = this.queryArr;
    newqq.queryArr.push(queryObj);
    return newqq;
  }

  dequeue = (metricName: string) => {
    if(this.queryArr.length > 0) {
      if(this.queryArr[0].metricName === metricName) {
        let newqq = new QueryQueue();
        newqq.queryArr = this.queryArr.slice(1);        
        return newqq;
      }
    }
    return this;
  }

  dequeueFirst = () => {
    if(this.queryArr.length > 0) {
      let newqq = new QueryQueue();
      newqq.queryArr = this.queryArr.slice(1);
      return newqq;
    }
    return this;
  }

  removeQueries = (metricName: string) => {
    let newqq = new QueryQueue();
    newqq.queryArr = this.queryArr.filter(item => item.metricName !== metricName)
    return newqq;
  }

  getQueryString = () => {
    if(this.queryArr.length === 0) return '';
    let query = this.queryArr[0];
    if(query.queryType === QueryType.QUERY_LAST) {
      return `
      {
        getLastKnownMeasurement(metricName: "${query.metricName}") {
          metric
          at
          value
          unit
        }
      }
      `;
    }
    else {
      return `
      {
        getMeasurements(input: {
          metricName: "${query.metricName}",
          after: ${String(query.after)},
          before: ${String(query.before)}
        }) {
          metric
          at
          value
          unit
        }
      }
      `;
    }
  }
}
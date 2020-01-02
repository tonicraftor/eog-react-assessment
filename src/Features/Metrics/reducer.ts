import { createSlice, PayloadAction } from 'redux-starter-kit';
import QueryQueue, {QueryType} from './QueryQueue';
import MeasurementData, { Measurements } from './MeasurementData';

export type ApiErrorAction = {
  error: string;
};

const initialState = new QueryQueue();

const slice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {
    metricsAddMetric: (state, action: PayloadAction<string>) => {
      //console.log('metricsAddMetric', action.payload);
      return state.enqueue({
        metricName: action.payload,
        queryType: QueryType.QUERY_LAST,
        after: 0,
        before: 0
      });
    },
    metricsRemoveMetric: (state, action: PayloadAction<string>) => {
      MeasurementData.removeMetric(action.payload);
      return state.removeQueries(action.payload);
    },
    metricsQueryLast: (state) => {      
      let metrics = MeasurementData.getMetrics();
      let newqq = state;
      //console.log('MeasurementData.getMetrics:', metrics);
      metrics.forEach(item => newqq = state.enqueue({
          metricName: item,
          queryType: QueryType.QUERY_LAST,
          after: 0,
          before: 0
      }));
      return newqq;
    },
    metricsDataReceived: (state, action: PayloadAction<Measurements>) => {
      if( action.payload.length === 0) return state.dequeueFirst();
      if(!state.queryArr.length) return state;
      //console.log('data received', action.payload);
      const metric = action.payload[0].metric;
      let querytype = state.queryArr[0].queryType;
      let newstate = state.dequeue(metric);
      
      let datalen = MeasurementData.addMeasurements(action.payload);
      if(datalen === 1 && querytype === QueryType.QUERY_LAST) {
        newstate = newstate.enqueue({
          metricName: metric,
          queryType: QueryType.QUERY_ALL,
          after: action.payload[0].at - 130000,
          before: action.payload[0].at - 1300
        });
      }
      return newstate
    },
    metricsApiErrorReceived: (state, action: PayloadAction<ApiErrorAction>) => state,
  },
});

export const reducer = slice.reducer;
export const actions = slice.actions;

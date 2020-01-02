import { reducer as weatherReducer } from '../Features/Weather/reducer';
import { reducer as metricsReducer } from '../Features/Metrics/reducer';

export default {
  weather: weatherReducer,
  metrics: metricsReducer
};
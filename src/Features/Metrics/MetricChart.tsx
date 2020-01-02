import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from './reducer';
import { Provider, createClient, useQuery } from 'urql';
import { IState } from '../../store';
//import {QueryType} from './QueryQueue';
import MeasurementData from './MeasurementData';

const client = createClient({
  url: 'https://react.eogresources.com/graphql',
});

export default () => {
  return (
    <Provider value={client}>
      <MetricList />
      <MetricChart />
    </Provider>
  );
};
const emptystrArr: string[] = [];
const baseMetricArr = {
  action: '',
  target: '',
  metrics: emptystrArr,
  toggleMetric: function(metricName: string) {
    let newarr = {...this};

    if(newarr.hasMetric(metricName)) {
      newarr.action = 'remove';
      newarr.target = metricName;
      newarr.metrics = newarr.metrics.filter(item => item !== metricName);
    }
    else {
      newarr.action = 'add';
      newarr.target = metricName;
      newarr.metrics = newarr.metrics.concat(metricName);
    }
    return newarr;
  },
  hasMetric: function(metricName: string) {
    return this.metrics.includes(metricName);
  }
}

const MetricList = () => {
  const [metricArr, setMetricArr] = useState(baseMetricArr);
  const queryQueue = useSelector((state: IState) => state.metrics);
  const dispatch = useDispatch();
  
  const toggleWaterTemp = () => {
    let newarr = metricArr.toggleMetric('waterTemp');
    if(newarr.action === 'add') {
      dispatch(actions.metricsAddMetric(newarr.target));
    }
    else {
      dispatch(actions.metricsRemoveMetric(newarr.target));
    }
    setMetricArr(newarr);
  }

  const toggleOilTemp = () => {
    let newarr = metricArr.toggleMetric('oilTemp');
    if(newarr.action === 'add') {
      dispatch(actions.metricsAddMetric(newarr.target));
    }
    else {
      dispatch(actions.metricsRemoveMetric(newarr.target));
    }
    setMetricArr(newarr);
  }

  return (
    <div>
      <button onClick={toggleWaterTemp}>
        {metricArr.hasMetric('waterTemp') ? 'Remove waterTemp' : 'Add waterTemp'}
      </button>
      <button onClick={toggleOilTemp}>
        {metricArr.hasMetric('oilTemp') ? 'Remove oilTemp' : 'Add oilTemp'}
      </button>
      { metricArr.metrics.length > 0 && queryQueue.queryArr.length > 0 ? <MetricQuery /> : null }
    </div>
    );
}

const MetricChart = (props: object) => {
  const [timer, setTimer] = useState(0);
  
  const dispatch = useDispatch();
  
  let canvas: HTMLCanvasElement | null = null;

  useEffect(() => {
    setTimeout(() => {setTimer( timer + 1)}, 1000);
    if(canvas) {
      let width = 600;
      let height = 400;
      if(canvas.parentElement){
        width = canvas.parentElement.clientWidth;
        height = canvas.parentElement.clientHeight;
        canvas.width = width;
        canvas.height = height;
        //console.log('canvas size:',[width,height]);
      }
      
      let ctx = canvas.getContext('2d');
      if(ctx) {
        ctx.clearRect(0, 0, width, height);
        let h = height - 80;
        let w = width -80;
        let hu = Math.floor(h/100);
        let wu = Math.floor(w/100);
        //draw axis
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.moveTo(40, 40);
        ctx.lineTo(40, height - 40);
        ctx.lineTo(width - 40,height - 40);
        ctx.stroke();
        //draw calib
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#202020";        
        for(let i = 0, y = height - 40; i < 101; i++) {
          ctx.moveTo(40, y);
          if(i % 10 === 0)ctx.lineTo(30, y);
          else ctx.lineTo(35, y);
          y -= hu;
        }
        for(let i = 0, x = 40; i < 101; i++) {
          ctx.moveTo(x, height - 40);
          if(i % 10 === 0)ctx.lineTo(x, height - 30);
          else ctx.lineTo(x, height - 35);
          x += wu;
        }
        ctx.stroke();
        //draw lines
        for(let i = 0; i < MeasurementData.data.length; i++) {
          let data = MeasurementData.data[i];
          if(data.length === 1)continue;
          //calculate range
          let idx0 = data.length <= 100 ? 0 : data.length - 100;
          let values = data.map(item => item.value);
          let max = Math.max(...values);
          let min = Math.min(...values);
          let diff = max - min;
          let factor = diff === 0 ? 1 : 50 / diff;
          
          ctx.strokeStyle = "#202020";
          for(let idx = idx0; idx < data.length; idx++) {
            let x = (idx - idx0) * wu;
            let y = height - 40 - Math.floor((data[idx].value - min) * factor + 25) * hu;
            x === 0 ? ctx.moveTo (x + 40, y) : ctx.lineTo (x + 40, y);
          }
          ctx.stroke();
        }
      }
      
      //console.log('redraw chart:', timer);
      //console.log('MeasurementData', MeasurementData.data);
    }
    dispatch(actions.metricsQueryLast());
  }, [canvas, dispatch, timer]);

  return (
  <div style={{width: '100%', height: 600}}>
    <canvas ref={c => canvas = c} style={{ borderWidth: 1, borderColor: '#000', borderStyle: 'solid'}}/>
  </div>
  );
};

const MetricQuery = () => {
  const dispatch = useDispatch();
  const queryQueue = useSelector((state: IState) => state.metrics);

  const query = queryQueue.getQueryString();
  //console.log('query string: ', query);
  //console.log('queryQueue changed', queryQueue.queryArr.length);
  
  const [result] = useQuery({
    query,
    requestPolicy: 'network-only'
  });
  const { data, error } = result;  
  
  useEffect(() => {    
    if (error) {
      dispatch(actions.metricsApiErrorReceived({ error: error.message }));
      return;
    }
    if (!data) return;
    let received;
    if('getLastKnownMeasurement' in data) {
      received = [data['getLastKnownMeasurement']];
    }
    else {
      received = data['getMeasurements'];
    }
    dispatch(actions.metricsDataReceived(received));
  }, [dispatch, data, error]);

  return <></>;
}


import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { actions } from './reducer';
import { Provider, createClient } from 'urql';
import MetricList, {metricColors, metricNames} from './MetricList.js';
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
        for(let i = 0, lineidx = 0; i < MeasurementData.data.length; i++) {
          let data = MeasurementData.data[i];
          if(data.length === 1)continue;
          //calculate range
          let idx0 = data.length <= 100 ? 0 : data.length - 100;
          let values = data.map(item => item.value);
          let max = Math.max(...values);
          let min = Math.min(...values);
          let diff = max - min;
          let factor = diff === 0 ? 1 : 50 / diff;
          
          let metricIdx = metricNames.indexOf(data[0].metric);
          if(metricIdx < 0 )continue;
          ctx.beginPath();
          ctx.strokeStyle = metricColors[metricIdx];
          for(let idx = idx0; idx < data.length; idx++) {
            let x = (idx - idx0) * wu;
            let y = height - 40 - Math.floor((data[idx].value - min) * factor + 25) * hu;
            x === 0 ? ctx.moveTo (x + 40, y) : ctx.lineTo (x + 40, y);
          }
          ctx.stroke();
          //draw labels
          let labelX = lineidx * 160 + 100;
          ctx.strokeStyle = '#000';
          roundedRect(ctx, labelX, 20, 140, 100, 10);

          //show last data
          let lastdata = data[data.length - 1];
          let labelXcenter = labelX + 70;
          ctx.beginPath();
          ctx.fillStyle = metricColors[metricIdx];
          ctx.font = '18px serif';
          ctx.textBaseline = 'hanging';
          ctx.textAlign = 'center';
          ctx.fillText(lastdata.metric, labelXcenter, 30);
          ctx.fillText(String(lastdata.value), labelXcenter, 50);          
          ctx.fillText(lastdata.unit, labelXcenter, 70);
          ctx.font = '16px serif';
          ctx.fillText('at ' + lastdata.at, labelXcenter, 90);
          ctx.stroke();

          lineidx++;
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

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number){
  ctx.beginPath();
  ctx.moveTo(x,y+radius);
  ctx.lineTo(x,y+height-radius);
  ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
  ctx.lineTo(x+width-radius,y+height);
  ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
  ctx.lineTo(x+width,y+radius);
  ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
  ctx.lineTo(x+radius,y);
  ctx.quadraticCurveTo(x,y,x,y+radius);
  ctx.stroke();
}
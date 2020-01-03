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

const EventWrapper = () => {
  const [data, setData] = useState({
    metric: '',
    value: 0,
    unit: '',
    at: ''
  });

  let dataTag: HTMLDivElement | null = null;

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {    
    //console.log('(x,y)', [event.nativeEvent.offsetX, event.nativeEvent.offsetY]);
    //calculate coordination
    if(dataTag && dataTag.parentElement) {
      let width = dataTag.parentElement.clientWidth;
      let height = dataTag.parentElement.clientHeight;
      let h = height - 80;
      let w = width - 80;
      let hu = Math.floor(h/100);
      let wu = Math.floor(w/100);
      let coordx = Math.round((event.nativeEvent.offsetX - 40) / wu);
      let coordy = Math.round((height - event.nativeEvent.offsetY - 40) / hu);
      if(coordx < 0 || coordx > 100 || coordy < 0 || coordy > 100)return;
      //console.log('(x,y)', [coordx, coordy]);
      for(let i = 0; i < MeasurementData.data.length; i++) {
        let dataCoords = MeasurementData.data[i].coordY;
        if(!dataCoords || coordx >= dataCoords.length)continue;
        if(dataCoords[coordx] === coordy) {
          let data = MeasurementData.data[i].dataArr[coordx];
          //show value 
            dataTag.style.display = 'block';
            dataTag.style.left = String(event.nativeEvent.offsetX)+'px';
            dataTag.style.top = String(event.nativeEvent.offsetY - 100)+'px';
            setData({
              metric: data.metric,
              value: data.value,
              unit: data.unit,
              at: new Date(data.at).toLocaleTimeString()
            });
          return;
        }
      }
      dataTag.style.display = 'none';
    }
  }

  return (
    <div onMouseMove={onMouseMove} style={{position:'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1}} >
      <div style={{
        position: 'absolute',
        display: 'none',
        top: 0,
        left: 0,
        width: 140,
        height: 100,
        background: 'rgba(255,208,183,0.7)',
        fontSize: '14px',
        border:'1px dashed #222222',
        textAlign: 'center'
      }}
        ref={d => dataTag = d}
      >
        <div>{data.metric}</div>
        <div>{data.value}</div>
        <div>{data.unit}</div>
        <div>{data.at}</div>
      </div>
    </div>
  )
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
        let w = width - 80;
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
          let data = MeasurementData.data[i].dataArr;
          if(data.length === 1)continue;
          //calculate range
          let idx0 = data.length <= 100 ? 0 : data.length - 100;
          data = data.slice(idx0);
          let min = MeasurementData.data[i].min;
          let max = MeasurementData.data[i].max;
          let diff = max - min;
          let factor = diff === 0 ? 1 : 50 / diff;
          
          let metricIdx = metricNames.indexOf(data[0].metric);
          if(metricIdx < 0 )continue;
          ctx.beginPath();
          ctx.strokeStyle = metricColors[metricIdx];
          let dataCoords = new Array(data.length);
          for(let idx = 0; idx < data.length; idx++) {
            let x = idx * wu;
            let y = Math.floor((data[idx].value - min) * factor + 25);
            dataCoords[idx] = y;
            y = height - 40 - y * hu;
            x === 0 ? ctx.moveTo (x + 40, y) : ctx.lineTo (x + 40, y);
          }
          MeasurementData.data[i].coordY = dataCoords;
          ctx.stroke();

          //draw labels
          let labelX = lineidx * 160 + 100;
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
          ctx.font = '14px serif';
          let timestr = new Date(lastdata.at).toLocaleString();
          ctx.fillText(timestr, labelXcenter, 90);
          ctx.stroke();

          //show time calib
          if(lineidx === 0) {
            ctx.beginPath();
            ctx.fillStyle = '#000';
            ctx.font = '14px serif';
            for(let idx = 9; idx < data.length; idx += 10) {
              let x = (idx + 1) * wu + 40;
              let y = height - 30;
              let timestr = new Date(data[idx].at).toLocaleTimeString();
              ctx.fillText(timestr, x, y);
            }
            ctx.stroke();
          }
          lineidx++;
        }
      }
    }
    dispatch(actions.metricsQueryLast());
  }, [canvas, dispatch, timer]);

  return (
  <div style={{width: '100%', height: 600, position: 'relative'}}>
    <canvas ref={c => canvas = c} style={{ borderWidth: 1, borderColor: '#000', borderStyle: 'solid'}}/>
    <EventWrapper />
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
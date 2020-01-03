import React, { useEffect, useState, SetStateAction } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actions } from './reducer';
import { useQuery } from 'urql';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import deepPurple from '@material-ui/core/colors/deepPurple';
import red from '@material-ui/core/colors/red';
import indigo from '@material-ui/core/colors/indigo';
import teal from '@material-ui/core/colors/teal';
import pink from '@material-ui/core/colors/pink';
import orange from '@material-ui/core/colors/orange';
import { IState } from '../../store';
import { Measurement } from './MeasurementData';


export const metricNames = [
  'waterTemp',
  'casingPressure',
  'injValveOpen',
  'flareTemp',
  'oilTemp',
  'tubingPressure'
]

export const metricColors = [
  deepPurple['A400'],
  red[900],
  indigo[900],
  teal[900],
  pink[900],
  orange[900]
]

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
    let dataArr: Measurement[];
    if('getLastKnownMeasurement' in data) {
      dataArr = [data['getLastKnownMeasurement']];
    }
    else {
      dataArr = data['getMeasurements'];
    }
    let values = dataArr.map(item => item.value);
    let max = Math.max(...values);
    let min = Math.min(...values);
    dispatch(actions.metricsDataReceived({dataArr, min, max, coordY: []}));
  }, [dispatch, data, error]);

  return <></>;
}

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
  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
  const [metricArr, setMetricArr] = useState(baseMetricArr);
  const queryQueue = useSelector((state: IState) => state.metrics);
  const dispatch = useDispatch();

  const handleClick = (event: React.MouseEvent) => {
    //let target: Element | null = event.currentTarget;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleMetric = (index: number) => {
    let newarr = metricArr.toggleMetric(metricNames[index]);
    if(newarr.action === 'add') {
      dispatch(actions.metricsAddMetric(newarr.target));
    }
    else {
      dispatch(actions.metricsRemoveMetric(newarr.target));
    }
    setMetricArr(newarr);
    handleClose();
  }
  
  let metriclist = metricNames.map((item,index) => (
    <MenuItem onClick={() => toggleMetric(index)} key={index} style={{color:metricColors[index]}}>
      {(metricArr.hasMetric(item) ? 'Remove ' : 'Add ') + item}
    </MenuItem>
  ))

  return (
    <div style={{textAlign:'center', margin:10}}>
      <Button
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={handleClick}
        style={{width:300,borderWidth:1,borderColor:'#202020',borderStyle:'solid'}}
      >
        Select Metric List
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {metriclist}
      </Menu>
      { metricArr.metrics.length > 0 && queryQueue.queryArr.length > 0 ? <MetricQuery /> : null }
    </div>
    );
}

export default MetricList;
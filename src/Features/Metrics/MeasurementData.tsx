export type Measurement = {
  metric: string;
  at: number;
  value: number;
  unit: string;
}

export type Measurements = {
  dataArr: Measurement[],
  min: number,
  max: number,
  coordY: number[]
};

var alldata: Measurements[] = []; 

var MeasurementData = {
  data: alldata,

  removeMetric: function(metricName: string) {
    let oldlen = this.data.length;
    this.data = this.data.filter( item => item.dataArr[0].metric !== metricName);
    return oldlen !== this.data.length;
  },

  addMeasurements: function(measurements: Measurements) {
    const metric = measurements.dataArr[0].metric;
    for(let i = 0; i< this.data.length; i++ ) {
      if(this.data[i].dataArr[0].metric === metric) {
        if(this.data[i].dataArr.length === 1) this.data[i].dataArr = measurements.dataArr.concat(this.data[i].dataArr);
        else this.data[i].dataArr = this.data[i].dataArr.concat(measurements.dataArr);
        if(measurements.min < this.data[i].min) this.data[i].min = measurements.min;
        if(measurements.max > this.data[i].max) this.data[i].max = measurements.max;
        return this.data[i].dataArr.length;
      }
    }
    this.data.push(measurements);
    return measurements.dataArr.length;
  },

  getMetrics: function() {
    let metrics: string[] = [];
    for(let i = 0; i< this.data.length; i++ ) {
      if(this.data[i].dataArr.length > 1) {
        metrics.push(this.data[i].dataArr[0].metric);
      }
    }
    return metrics;
  }
};

export default MeasurementData;


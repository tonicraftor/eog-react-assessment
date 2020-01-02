

export type Measurements = {
  metric: string;
  at: number;
  value: number;
  unit: string;
}[];

var alldata: Measurements[] = []; 

var MeasurementData = {
  data: alldata,

  removeMetric: function(metricName: string) {
    let oldlen = this.data.length;
    this.data = this.data.filter( item => item[0].metric !== metricName);
    return oldlen !== this.data.length;
  },

  addMeasurements: function(measurements: Measurements) {
    const metric = measurements[0].metric;
    for(let i = 0; i< this.data.length; i++ ) {
      if(this.data[i][0].metric === metric) {
        this.data[i] = this.data[i].concat(measurements);
        return this.data[i].length;
      }
    }
    this.data.push(measurements);
    return measurements.length;
  },

  getMetrics: function() {
    let metrics: string[] = [];
    for(let i = 0; i< this.data.length; i++ ) {
      if(this.data[i].length > 1) {
        metrics.push(this.data[i][0].metric);
      }
    }
    return metrics;
  }
};

export default MeasurementData;


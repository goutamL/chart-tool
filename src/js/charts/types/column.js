import { axisManager as Axis, axisCleanup, addZeroLine, dropOversetTicks } from '../components/axis';
import { scaleManager as Scale } from '../components/scale';
import { timeInterval } from '../../utils/utils';
import 'd3-selection-multi';

export default function columnChart(node, obj) {

  const xScaleObj = new Scale(obj, 'xAxis'),
    yScaleObj = new Scale(obj, 'yAxis'),
    xScale = xScaleObj.scale, yScale = yScaleObj.scale;

  const xAxisObj = new Axis(node, obj, xScaleObj.scale, 'xAxis'),
    yAxisObj = new Axis(node, obj, yScaleObj.scale, 'yAxis');

  axisCleanup(node, obj, xAxisObj, yAxisObj);

  let singleColumn;

  switch (obj.xAxis.scale) {
    case 'time':
      singleColumn = obj.dimensions.tickWidth() / (timeInterval(obj.data.data) + 1) / obj.data.seriesAmount;
      xAxisObj.range = [0, (obj.dimensions.tickWidth() - (singleColumn * obj.data.seriesAmount))];
      axisCleanup(node, obj, xAxisObj, yAxisObj);
      break;
    case 'ordinal-time':
      singleColumn = xScale(obj.data.data[1].key) - xScale(obj.data.data[0].key);
      xAxisObj.node = node.select(`.${obj.prefix}axis-group.${obj.prefix}xAxis`)
        .attr('transform', `translate(${obj.dimensions.computedWidth() - obj.dimensions.tickWidth() - (singleColumn / 2)},${obj.dimensions.computedHeight() - obj.dimensions.xAxisHeight})`);
      dropOversetTicks(xAxisObj.node, obj.dimensions.tickWidth());
      break;
    case 'ordinal':
      singleColumn = xScale.bandwidth() / obj.data.seriesAmount;
      break;
  }

  const seriesGroup = node.append('g')
    .attr('class', () => {
      let output = `${obj.prefix}series_group`;
      if (obj.data.seriesAmount > 1) {
        output += ` ${obj.prefix}multiple`;
      }
      return output;
    })
    .attr('transform', () => {
      let xOffset;
      if (obj.xAxis.scale === 'ordinal-time') {
        xOffset = obj.dimensions.computedWidth() - obj.dimensions.tickWidth() - (singleColumn / 2);
      } else {
        xOffset = obj.dimensions.computedWidth() - obj.dimensions.tickWidth();
      }
      return `translate(${xOffset},0)`;
    });

  let series, columnItem;

  for (let i = 0; i < obj.data.seriesAmount; i++) {

    series = seriesGroup.append('g').attr('class', `${obj.prefix}series-${i}`);

    columnItem = series
      .selectAll(`.${obj.prefix}column`)
      .data(obj.data.data).enter()
      .append('g')
      .attrs({
        'class': `${obj.prefix}column ${obj.prefix}column-${i}`,
        'data-series': i,
        'data-key': function(d) { return d.key; },
        'data-legend': function() { return obj.data.keys[i + 1]; },
        'transform': function(d) {
          if (obj.xAxis.scale !== 'ordinal-time') {
            return `translate(${xScale(d.key)},0)`;
          }
        }
      });

    columnItem.append('rect')
      .attrs({
        'class': function(d) {
          return d.series[i].val < 0 ? `${obj.prefix}negative` : `${obj.prefix}positive`;
        },
        'x': function(d) {
          if (obj.xAxis.scale !== 'ordinal-time') {
            return i * singleColumn;
          } else {
            return xScale(d.key);
          }
        },
        'y': function(d) {
          if (d.series[i].val !== '__undefined__') {
            return yScale(Math.max(0, d.series[i].val));
          }
        },
        'height': function(d) {
          if (d.series[i].val !== '__undefined__') {
            return Math.abs(yScale(d.series[i].val) - yScale(0));
          }
        },
        'width': function() {
          if (obj.xAxis.scale !== 'ordinal-time') {
            return singleColumn;
          } else {
            return singleColumn / obj.data.seriesAmount;
          }
        }
      });

    if (obj.data.seriesAmount > 1) {

      const columnOffset = obj.dimensions.bands.offset;

      columnItem.selectAll('rect')
        .attrs({
          'x': function(d) {
            if (obj.xAxis.scale !== 'ordinal-time') {
              return ((i * singleColumn) + (singleColumn * (columnOffset / 2)));
            } else {
              return xScale(d.key) + (i * (singleColumn / obj.data.seriesAmount));
            }
          },
          'width': () => {
            if (obj.xAxis.scale !== 'ordinal-time') {
              return (singleColumn - (singleColumn * columnOffset));
            } else {
              return singleColumn / obj.data.seriesAmount;
            }
          }
        });
    }

  }

  addZeroLine(obj, node, yAxisObj, 'yAxis');

  return {
    xScaleObj: xScaleObj,
    yScaleObj: yScaleObj,
    xAxisObj: xAxisObj,
    yAxisObj: yAxisObj,
    seriesGroup: seriesGroup,
    series: series,
    singleColumn: singleColumn,
    columnItem: columnItem
  };

}

//
// This file is part of interposcatter
//
//(C) 2021 Cosmin Deaconu <cozzyd@kicp.uchicago.edu>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE

import React from 'react';
import { PanelProps, DataFrame } from '@grafana/data';
import { InterpoScatterOptions } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory, useTheme } from '@grafana/ui';
import { interpolateYontoX } from 'interpolate';
import Plot from 'react-plotly.js';
import CSS from 'csstype';

interface Props extends PanelProps<InterpoScatterOptions> {}

function checkSeries(series: DataFrame) {
  return series.fields?.length > 1 && series.fields[0].type === 'time' && series.fields[1].type === 'number';
}

function seriesName(series: DataFrame) {
  return series.name === undefined ? series.fields[1].name : series.name;
}

export const InterpoScatterPanel: React.FC<Props> = ({ options, data, width, height }) => {
  const theme = useTheme();
  const styles = getStyles();

  //we need a time series with two metrics (two numerics).
  if (data.series?.length < 2) {
    return (
      <div>
        <p>
          <b> I need two series, each with a numeric value and a time value! </b>
        </p>
      </div>
    );
  }

  //now let's get the two series we want. This is either the first 2, or the ones that match the settings.

  const xName = options.xName?.trim() || '';
  const yName = options.yName?.trim() || '';
  let xIndex = 0;
  let messages = '';
  let regex = /^@\d+@$/;
  if (regex.test(xName)) {
    const xIndexMaybe = parseInt(xName.slice(1, -1), 10);
    if (xIndexMaybe >= data.series.length) {
      messages += 'numeric xName of ' + xIndex + ' is too big, using 0 ';
    } else {
      xIndex = xIndexMaybe;
    }
  } else if (xName !== '') {
    let matched = false;
    for (let i = 0; i < data.series.length; i++) {
      if (seriesName(data.series[i])?.trim() === xName) {
        xIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      messages += 'Did not find match for ' + xName + '. Using first available. ';
    }
  }

  let yIndex = xIndex === 0 ? 1 : 0;
  if (regex.test(yName)) {
    const yIndexMaybe = parseInt(yName.slice(1, -1), 10);
    if (yIndexMaybe >= data.series.length) {
      messages += 'numeric yName of ' + yIndex + ' is too big, using 0 ';
    } else {
      yIndex = yIndexMaybe;
    }
  } else if (yName !== '') {
    let matched = false;
    for (let i = 0; i < data.series.length; i++) {
      if (seriesName(data.series[i])?.trim() === yName) {
        yIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      messages += 'Did not find match for ' + yName + '. Using first available. ';
    }
  }

  //check if we have the normal time series stuff. In the future, we can make this more robust / permissive.

  if (!checkSeries(data.series[xIndex]) || !checkSeries(data.series[yIndex])) {
    return (
      <div>
        <p> {messages} </p>
        <p>
          <b> Did not get numeric time series! </b>
        </p>
      </div>
    );
  }

  // now we have two fields we like, let's interpolate and make a plot

  const xTimes = data.series[xIndex].fields[0].values;
  const yTimes = data.series[yIndex].fields[0].values;

  const xVals = data.series[xIndex].fields[1].values;
  const yVals = data.series[yIndex].fields[1].values;

  const plotVals = interpolateYontoX(xTimes, xVals, yTimes, yVals, options.edgeBehavior, options.interpolateType);

  const bgcolor = theme.isDark ? '#141619' : '#fff';
  const gridcolor = theme.isDark ? '#bbb' : '#444';
  const fgcolor = theme.isDark ? '#fff' : '#000';

  let csv_content =
    'data:text/csv;charset=utf-8,' +
    seriesName(data.series[xIndex]) +
    ',' +
    seriesName(data.series[yIndex]) +
    ',unixtime_x,delta_t_y\r\n';
  for (let i = 0; i < plotVals.x.length; i++) {
    csv_content +=
      plotVals.x[i] + ',' + plotVals.y[i] + ',' + plotVals.t[i] / 1000 + ',' + plotVals.dt[i] / 1000 + '\r\n';
  }

  var plotlyData: any[] = [];

  if (options.plotType === 'histo') {
    plotlyData.push({
      x: plotVals.x,
      y: plotVals.y,
      type: 'histogram2d',
      colorscale: 'Blackbody',
      nbinsx: options.nbinsx,
      nbinsy: options.nbinsy,
    });
  } else {
    plotlyData.push({
      x: plotVals.x,
      y: plotVals.y,
      type: 'scatter',
      mode: options.plotType === 'lines' ? 'lines+markers' : 'markers',
    });
  }

  const barStyle: CSS.Properties = {
    marginBottom: '0px',
    marginTop: '0px',
    lineHeight: 1,
  };

  const plotHeight = height < 64 ? 32 : height - 32;

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `
      )}
    >
      <Plot
        data={plotlyData}
        layout={{
          xaxis: {
            title: seriesName(data.series[xIndex]),
            showgrid: true,
            color: fgcolor,
            axiscolor: gridcolor,
            gridcolor: gridcolor,
          },
          yaxis: {
            title: seriesName(data.series[yIndex]),
            showgrid: true,
            color: fgcolor,
            axiscolor: gridcolor,
            gridcolor: gridcolor,
          },
          width: width,
          height: plotHeight,
          paper_bgcolor: bgcolor,
          plot_bgcolor: bgcolor,
          font: { color: fgcolor },
          margin: { 
            l: 40, r: 30, b: 40, t: 20, pad: 0
          }
        }}
      />

      <p style={barStyle}>
        <a href={encodeURI(csv_content)}>[download data csv]</a> <b> {messages} </b>
      </p>
    </div>
  );
};

const getStyles = stylesFactory(() => {
  return {
    wrapper: css`
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
  };
});

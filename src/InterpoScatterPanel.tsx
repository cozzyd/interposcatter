import React from 'react';
import { PanelProps, DataFrame, Vector } from '@grafana/data';
import { InterpoScatterOptions, EdgeBehavior, InterpolateType } from 'types';
import { css, cx } from 'emotion';
import { stylesFactory, useTheme } from '@grafana/ui';
import Plot from 'react-plotly.js';

interface Props extends PanelProps<InterpoScatterOptions> {}

function checkSeries(series: DataFrame) {
  return series.fields?.length > 1 && series.fields[0].type === 'time' && series.fields[1].type === 'number';
}

function seriesName(series: DataFrame) {
  return series.name === undefined ? series.fields[1].name : series.name;
}

function lowerBound(x: number, xs: Vector<number>) {
  let ifirst = 0;
  let ilast = xs.length;
  let count = ilast - ifirst;

  while (count > 0) {
    const step = Math.floor(count / 2);
    if (xs.get(ifirst + step) < x) {
      ifirst += 1 + step;
      count -= 1 + step;
    } else {
      count = step;
    }
  }

  return ifirst;
}

function interpolateYontoX(
  xt: Vector<number>,
  xv: Vector<number>,
  yt: Vector<number>,
  yv: Vector<number>,
  edge: EdgeBehavior,
  how: InterpolateType
) {
  let interpolated: number[][] = [[], []];

  //loop over xs

  const xlen = xt.length;
  const ylen = yt.length;
  //assume sorted, TODO check if this is necessarily true
  const y_tmin = yt.get(0);
  const y_tmax = yt.get(ylen - 1);

  let extrapolate_m_low = 0;
  const extrapolate_b_low = yv.get(0);
  let extrapolate_m_high = 0;
  const extrapolate_b_high = yv.get(ylen - 1);

  if (edge === 'extrapolate' && ylen > 1) {
    extrapolate_m_low = (yv.get(1) - yv.get(0)) / (yt.get(1) - yt.get(0));
    extrapolate_m_high = (yv.get(ylen - 1) - yv.get(ylen - 2)) / (yt.get(ylen - 1) - yt.get(ylen - 2));
  }

  for (let i = 0; i < xlen; i++) {
    //The usual case, time of x is bounded by y times
    if (xt.get(i) >= y_tmin && xt.get(i) <= y_tmax) {
      interpolated[0].push(xv.get(i));

      const ilowerbound = lowerBound(xt.get(i), yt);
      //equal case, no interpolation necessary
      if (yt.get(ilowerbound) === xt.get(i)) {
        interpolated[1].push(yv.get(ilowerbound));
      } else if (how === 'zerohold') {
        interpolated[1].push(yv.get(ilowerbound - 1));
      } else {
        //linear interpolation!
        const tlow = yt.get(ilowerbound - 1);
        const thigh = yt.get(ilowerbound);
        const t = xt.get(i);
        const vlow = yv.get(ilowerbound - 1);
        const vhigh = yv.get(ilowerbound);
        const frac = (t - tlow) / (thigh - tlow);
        interpolated[1].push(frac * vhigh + (1 - frac) * vlow);
      }

      // outside range
    } else if (edge === 'zerohold') {
      interpolated[0].push(xv.get(i));
      interpolated[1].push(xt.get(i) < y_tmin ? yv.get(0) : yv.get(ylen - 1));
    } else if (edge === 'extrapolate') {
      interpolated[0].push(xv.get(i));
      interpolated[1].push(
        xt.get(i) < y_tmin
          ? extrapolate_b_low + extrapolate_m_low * (xt.get(i) - y_tmin)
          : extrapolate_b_high + extrapolate_m_high * (xt.get(i) - y_tmax)
      );
    }
  }

  return interpolated;
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

  const xName = options.xName.trim();
  const yName = options.yName.trim();
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

  const bgcolor = theme.isDark ? '#000' : '#fff';
  const gridcolor = theme.isDark ? '#bbb' : '#444';
  const fgcolor = theme.isDark ? '#fff' : '#000';

  var plotlyData: any[] = [];

  if (options.plotType === 'histo') {
    plotlyData.push({
      x: plotVals[0],
      y: plotVals[1],
      type: 'histogram2d',
      nbinsx: options.nbinsx,
      nbinsy: options.nbinsy,
    });
  } else {
    plotlyData.push({
      x: plotVals[0],
      y: plotVals[1],
      type: 'scatter',
      mode: options.plotType === 'lines' ? 'lines+markers' : 'markers',
    });
  }

  console.log(bgcolor);
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
      <p>
        <b> {messages} </b>
      </p>

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
          height: height,
          paper_bgcolor: bgcolor,
          plot_bgcolor: bgcolor,
          font: { color: fgcolor },
        }}
      />
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

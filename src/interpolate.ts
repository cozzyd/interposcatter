// interpolate.ts implements utility methods for Interposcatter.
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

import { EdgeBehavior, InterpolateType, Interpolated } from 'types';
import { Vector } from '@grafana/data';

export function lowerBound(x: number, xs: Vector<number>, ifirst = 0) {
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

function dtCalc(x: number, x0: number, x1: number) {
  if (Math.abs(x - x0) < Math.abs(x - x1)) {
    return x - x0;
  }
  return x - x1;
}

export function interpolateYontoX(
  xt: Vector<number>,
  xv: Vector<number>,
  yt: Vector<number>,
  yv: Vector<number>,
  edge: EdgeBehavior,
  how: InterpolateType
) {
  let interpolated = new Interpolated();

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

  // Because both arrays are assumed to be sorted, ilowerbound should be monotonically increasing
  let ilowerbound = 0;

  for (let i = 0; i < xlen; i++) {
    //The usual case, time of x is bounded by y times
    if (xt.get(i) >= y_tmin && xt.get(i) <= y_tmax) {
      interpolated.x.push(xv.get(i));
      interpolated.t.push(xt.get(i));

      ilowerbound = lowerBound(xt.get(i), yt, ilowerbound);
      //equal case, no interpolation necessary
      if (yt.get(ilowerbound) === xt.get(i)) {
        interpolated.y.push(yv.get(ilowerbound));
        interpolated.dt.push(0);
      } else if (how === 'zerohold') {
        interpolated.y.push(yv.get(ilowerbound - 1));
        interpolated.dt.push(xt.get(i) - yt.get(ilowerbound - 1));
      } else {
        //linear interpolation!
        const tlow = yt.get(ilowerbound - 1);
        const thigh = yt.get(ilowerbound);
        const t = xt.get(i);
        const vlow = yv.get(ilowerbound - 1);
        const vhigh = yv.get(ilowerbound);
        const frac = (t - tlow) / (thigh - tlow);
        interpolated.y.push(frac * vhigh + (1 - frac) * vlow);
        interpolated.dt.push(dtCalc(t, tlow, thigh));
      }

      // outside range
    } else if (edge === 'zerohold') {
      interpolated.x.push(xv.get(i));
      interpolated.y.push(xt.get(i) < y_tmin ? yv.get(0) : yv.get(ylen - 1));
      interpolated.t.push(xt.get(i));
      interpolated.dt.push(xt.get(i) < y_tmin ? xt.get(i) - y_tmin : xt.get(i) - y_tmax);
    } else if (edge === 'extrapolate') {
      interpolated.x.push(xv.get(i));
      interpolated.y.push(
        xt.get(i) < y_tmin
          ? extrapolate_b_low + extrapolate_m_low * (xt.get(i) - y_tmin)
          : extrapolate_b_high + extrapolate_m_high * (xt.get(i) - y_tmax)
      );

      interpolated.t.push(xt.get(i));
      interpolated.dt.push(xt.get(i) < y_tmin ? xt.get(i) - y_tmin : xt.get(i) - y_tmax);
    }
  }

  return interpolated;
}

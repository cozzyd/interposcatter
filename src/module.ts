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

import { PanelPlugin } from '@grafana/data';
import { InterpoScatterOptions } from './types';
import { SeriesSelector } from './SeriesSelector';
import { InterpoScatterPanel } from './InterpoScatterPanel';

export const plugin = new PanelPlugin<InterpoScatterOptions>(InterpoScatterPanel).setPanelOptions(builder => {
  return builder
    .addRadio({
      path: 'plotType',
      defaultValue: 'points',
      name: 'Plot Type',
      settings: {
        options: [
          {
            value: 'points',
            label: 'Points',
          },
          {
            value: 'lines',
            label: 'Lines',
          },
          {
            value: 'histo',
            label: 'Histogram',
          },
        ],
      },
    })
    .addCustomEditor({
      path: 'xName',
      id: 'xName',
      editor: SeriesSelector,
      name: 'x series',
    })
    .addCustomEditor({
      path: 'yName',
      id: 'yName',
      editor: SeriesSelector,
      name: 'y series',
    })
    .addRadio({
      path: 'edgeBehavior',
      defaultValue: 'ignore',
      name: 'Out-of-Bounds Behavior',
      settings: {
        options: [
          {
            value: 'ignore',
            label: 'Ignore',
          },
          {
            value: 'zerohold',
            label: 'Zero-Hold',
          },
          {
            value: 'extrapolate',
            label: 'Extrapolate',
          },
        ],
      },
    })
    .addRadio({
      path: 'interpolateType',
      defaultValue: 'linear',
      name: 'Interpolate Type',
      settings: {
        options: [
          {
            value: 'zerohold',
            label: 'Zero-Hold',
          },
          {
            value: 'linear',
            label: 'Linear',
          },
        ],
      },
    })
    .addTextInput({
      path: 'nbinsx',
      defaultValue: '50',
      name: 'nbinsx passed to plotly for histogram',
    })
    .addTextInput({
      path: 'nbinsy',
      defaultValue: '50',
      name: 'nbinsy passed to plotly for histogram',
    });
});

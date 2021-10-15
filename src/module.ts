import { PanelPlugin } from '@grafana/data';
import { InterpoScatterOptions } from './types';
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
    .addTextInput({
      path: 'xName',
      defaultValue: '',
      name: 'x series (leave blank for first available, or use @i@ for ith, 0-indexed)',
    })
    .addTextInput({
      path: 'yName',
      defaultValue: '',
      name: 'y series (leave blank for first available, or use @i@ for ith, 0-indexed)',
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

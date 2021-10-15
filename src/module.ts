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
      name: 'x series (leave blank for first available)',
    })
    .addTextInput({
      path: 'yName',
      defaultValue: '',
      name: 'y series (leave blank for first available)',
    })
    .addRadio({
      path: 'edgeBehavior',
      defaultValue: 'ignore',
      name: 'Edge Behavior',
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
            label: 'iExtrapoalte',
          },
        ],
      },
    });
});

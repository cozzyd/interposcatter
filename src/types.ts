export type PlotType = 'points' | 'lines' | 'histo';
export type InterpolateType = 'linear' | 'zerohold';
export type EdgeBehavior = 'ignore' | 'zerohold' | 'extrapolate';

export class Interpolated {
  x: number[] = [];
  y: number[] = [];
  t: number[] = [];
  dt: number[] = [];
}

export interface InterpoScatterOptions {
  plotType: PlotType;
  xName: string;
  yName: string;
  nbinsx: number;
  nbinsy: number;
  edgeBehavior: EdgeBehavior;
  interpolateType: InterpolateType;
}

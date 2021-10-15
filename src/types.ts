export type PlotType = 'points' | 'lines' | 'histo';
export type EdgeBehavior = 'ignore' | 'zerohold' | 'extrapolate';

export interface InterpoScatterOptions {
  plotType: PlotType;
  xName: string;
  yName: string;
  edgeBehavior: EdgeBehavior;
}

// Tests for interpolate.js 
import { ArrayVector } from '@grafana/data';
import { lowerBound, interpolateYontoX } from 'interpolate' 

describe('interpolate tests', () => {

  it('testing lower bound', () => {
    let haystack = new ArrayVector([ 1, 3, 8, 9 , 10, 15]); 
    expect(lowerBound(0,haystack)).toEqual(0); 
    expect(lowerBound(1,haystack)).toEqual(0); 
    expect(lowerBound(2,haystack)).toEqual(1); 
    expect(lowerBound(9.5,haystack)).toEqual(4); 
    expect(lowerBound(16,haystack)).toEqual(6); 
  });


  it('testing interpolateYonToX', () => {
    let x_t = new ArrayVector([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); 
    let x_v = new ArrayVector([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); 
    let y_t = new ArrayVector([-2, 0, 2, 4, 6, 8]); 
    let y_v = new ArrayVector([2, 0, 5, -5, 5, 10]); 

    let interpolated = interpolateYontoX(x_t, x_v, y_t, y_v,'ignore','linear')

    expect(interpolated.t[0]).toEqual(0);
    expect(interpolated.x[0]).toEqual(0);
    expect(interpolated.y[0]).toEqual(0);
    expect(interpolated.y[1]).toEqual(2.5);
    expect(Math.abs(interpolated.dt[1])).toEqual(1);
    expect(interpolated.dt[0]).toEqual(0);

    let interpolated_extrapolate =  interpolateYontoX(x_t, x_v, y_t, y_v,'extrapolate','linear')
    expect (interpolated_extrapolate.y[9]).toEqual(12.5) ; 
  }); 


}); 

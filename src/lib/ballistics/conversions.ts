const INCHES_PER_100YD_PER_MIL = 3.6;
const INCHES_PER_100YD_PER_MOA = 1.047;

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function yardsToFeet(yards: number): number {
  return yards * 3;
}

export function mphToFps(mph: number): number {
  return mph * 1.4666666667;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function inchesToMil(inches: number, distanceYd: number): number {
  return inches / ((distanceYd / 100) * INCHES_PER_100YD_PER_MIL);
}

export function inchesToMoa(inches: number, distanceYd: number): number {
  return inches / ((distanceYd / 100) * INCHES_PER_100YD_PER_MOA);
}

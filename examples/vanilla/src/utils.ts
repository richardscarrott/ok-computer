export const uuid = () => Math.random().toString(36).slice(-6);

export const pickRandom = <T>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];

export const randomNumber = (min: number, max: number) =>
  Math.random() * (max - min) + min;

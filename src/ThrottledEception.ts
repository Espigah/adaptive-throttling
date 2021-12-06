class ThrottledEception extends Error {
  constructor(public message: string = 'The request was throttled.') {
    super(message);
    this.name = 'ThrottledEception';
    this.stack = (<any>new Error()).stack;
  }
}

export default ThrottledEception;

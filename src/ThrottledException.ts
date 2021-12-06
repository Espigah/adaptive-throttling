class ThrottledException extends Error {
  constructor(public message: string = 'The request was throttled.') {
    super(message);
    this.name = 'ThrottledException';
    this.stack = (<any>new Error()).stack;
  }
}

export default ThrottledException;

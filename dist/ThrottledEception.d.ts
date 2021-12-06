declare class ThrottledEception extends Error {
    message: string;
    constructor(message?: string);
}
export default ThrottledEception;

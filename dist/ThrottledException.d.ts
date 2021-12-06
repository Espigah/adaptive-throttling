declare class ThrottledException extends Error {
    message: string;
    constructor(message?: string);
}
export default ThrottledException;

import { AdaptiveThrottling } from '../src/index';

const exception = () => {
  return new Promise(() => {
    throw new Error('some error');
  });
};

const success = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('success');
    }, 1000);
  });
};
describe('Adaptive Throttling', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
  });
  test('success case', async () => {
    const data = await AdaptiveThrottling().execute(success);
    expect(data).toEqual('success');
  });

  test('exception case', async () => {
    const action = async () => {
      await AdaptiveThrottling().execute(exception);
    };

    await expect(action()).rejects.toThrow('some error');
  });

  test('throttled case', async () => {
    const adaptiveThrottling = AdaptiveThrottling({
      historyTimeMinute: 0.1,
      k: 0.2,
      upperLimiteToReject: 0.8,
    });
    for (let i = 0; i < 100; i++) {
      try {
        await adaptiveThrottling.execute(exception);
      } catch (error) {}
    }

    const action = async () => {
      await adaptiveThrottling.execute(success);
    };

    expect(adaptiveThrottling.requestRejectionProbability).toEqual(0.8);
    await expect(action()).rejects.toThrow('The request was throttled.');
  });
});

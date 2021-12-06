import { createAdaptiveThrottling } from '../src/index';

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

test('Adaptive Throttling : success case', async () => {
  const data = await createAdaptiveThrottling().execute(success);
  expect(data).toEqual('success');
});

test('Adaptive Throttling : exception case', async () => {
  const action = async () => {
    await createAdaptiveThrottling().execute(exception);
  };

  await expect(action()).rejects.toThrow('some error');
});

test('Adaptive Throttling : out of quota case', async () => {
  const adaptiveThrottling = createAdaptiveThrottling(0.1, 0.2, 0.8);
  await adaptiveThrottling.execute(success);
  for (let i = 0; i < 19; i++) {
    try {
      await adaptiveThrottling.execute(() => {
        return new Promise((_resolve, reject) => {
          setTimeout(() => {
            reject('reject');
          }, 100);
        });
      });
    } catch (error) {}
  }

  expect(adaptiveThrottling.getCutoffIsReached()).toEqual(true);
});

// test('Adaptive Throttling : out of quota case', async () => {
//   const adaptiveThrottling = createAdaptiveThrottling({
//     historyTime: 0.1,
//     timesAsLargeAsAccepts: 0.2,
//     chanceOfRejectingNewRequesLimit: 0.8,
//   });
//   await adaptiveThrottling.execute(success);
//   for (let i = 0; i < 19; i++) {
//     try {
//       await adaptiveThrottling.execute(() => {
//         return new Promise((resolve, reject) => {
//           setTimeout(() => {
//             reject('reject');
//           }, 1);
//         });
//       });
//     } catch (error) {}
//   }

//   for (let i = 0; i < 1; i++) {
//     try {
//       await adaptiveThrottling.execute(() => {
//         return new Promise((resolve, reject) => {
//           setTimeout(() => {
//             resolve('resolve');
//           }, 1000);
//         });
//       });
//     } catch (error) {}
//   }

//   expect(adaptiveThrottling.getCutoffIsReached()).toEqual(true);
// });

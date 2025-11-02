export const formatDate = (nanoseconds: bigint): string => {
  if (typeof nanoseconds !== 'bigint') {
    return 'Invalid date';
  }
  const milliseconds = Number(nanoseconds / 1000000n);
  const date = new Date(milliseconds);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
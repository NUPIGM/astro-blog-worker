export const getMoveIndex = (
  mouseEventDirection: number,
  elPosition: number,
  elDimension: number,
  movementSpeed: number
) => {
  const relativePos = mouseEventDirection - elPosition;
  return (relativePos - elDimension / 2) / movementSpeed;
};

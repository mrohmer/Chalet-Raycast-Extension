type Key = string | number | symbol;
export type FilterFunction<K extends Key, V> = (key: K, value: V) => boolean;
export const filterObject = <
  T extends Record<Key, any>,
  R extends Partial<T> = Partial<T>
>(
  obj: T,
  fn: FilterFunction<keyof T, T[keyof T]>
): R =>
  Object.entries(obj)
    .filter(([key, value]) => fn(key, value))
    .reduce(
      (prev, [key, monitor]) => ({
        ...prev,
        [key]: monitor,
      }),
      {} as R
    );

export const entriesToObject = <E extends Record<string, any>>(entries: [keyof E, E[keyof E]][]): E => entries
  .reduce(
    (prev, [key, monitor]) => ({
      ...prev,
      [key]: monitor,
    }),
    {} as E
  )

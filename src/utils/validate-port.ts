export const validatePort = (portStr: string): string | undefined => {
  if (!portStr?.trim()) {
    return "Port cannot be empty.";
  }
  if (!/^[1-9]\d+$/.test(portStr) || isNaN(parseInt(portStr))) {
    return "Port needs to be number.";
  }
  const port = parseInt(portStr);
  if (port <= 0 || port > 65000) {
    return "Port needs to be between 1 & 65000.";
  }

  return undefined;
};

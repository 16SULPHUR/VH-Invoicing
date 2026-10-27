export function setAppBadge(count) {
  if (typeof navigator.setAppBadge !== "function") return;
  const update = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();
  update?.catch?.(() => {});
}

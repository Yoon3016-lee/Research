/**
 * @deprecated 정적 export의 `/primeax-home/script.js` (`window.PrimeAX.init`)를 사용합니다.
 * 호환용으로 남겨 두었습니다.
 */
export type PrimeaxHomeCleanup = () => void;

export function initPrimeaxHome(_root: ParentNode): PrimeaxHomeCleanup {
  return () => {};
}

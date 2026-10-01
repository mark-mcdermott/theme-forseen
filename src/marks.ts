import { cloud, wordmark } from "./brand.js";

/**
 * The marks and icons the drawer draws inline. Each is a string of SVG so
 * the template can place it; none depends on a font or a fetch.
 */

/** The cloud with bands of the current palette inside its outline */
export function adaptiveCloud(className: string): string {
  const { counterBox, bandEdges } = cloud;
  const bands = bandEdges
    .slice(0, -1)
    .map((edge, i) => {
      const y = counterBox.y + edge * counterBox.height;
      const height = (bandEdges[i + 1] - edge) * counterBox.height + 0.5;
      return `<rect x="0" y="${y}" width="${cloud.width}" height="${height}" style="fill: var(--tf-cloud-${i + 1})"/>`;
    })
    .join("");

  return `<svg class="${className}" viewBox="0 0 ${cloud.width} ${cloud.height}" aria-hidden="true">
    <clipPath id="tf-cloud-counter"><path d="${cloud.counter}"/></clipPath>
    <g clip-path="url(#tf-cloud-counter)">${bands}</g>
    <path d="${cloud.outer}${cloud.counter}" fill-rule="evenodd" fill="currentColor"/>
  </svg>`;
}

/** The secondary mark: the silhouette alone, one colour */
export function filledCloud(className: string): string {
  return `<svg class="${className}" viewBox="0 0 ${cloud.width} ${cloud.height}" aria-hidden="true"><path d="${cloud.outer}" fill="currentColor"/></svg>`;
}

export function wordmarkSvg(className: string): string {
  return `<svg class="${className}" viewBox="0 0 ${wordmark.width} ${wordmark.height}" role="img" aria-label="ThemeForseen"><path d="${wordmark.d}" fill="currentColor"/></svg>`;
}

const icon = (body: string, viewBox = "0 0 24 24") =>
  `<svg class="icon" viewBox="${viewBox}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const icons = {
  list: icon('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  aa: `<svg class="icon icon-aa" viewBox="0 0 40 24" aria-hidden="true"><text x="0" y="20" font-size="24" font-weight="700" font-family="inherit" fill="currentColor">Aa</text></svg>`,
  sun: icon(
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  ),
  search: icon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  heart: icon(
    '<path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.6 3.6 4.5 6.9 4.5c2 0 3.6 1.1 5.1 2.9 1.5-1.8 3.1-2.9 5.1-2.9 3.3 0 5.4 3.1 4.2 6.6-1.8 4.8-9.3 9.4-9.3 9.4Z"/>'
  ),
  star: icon(
    '<path d="m12 3.2 2.7 5.7 6.2.8-4.5 4.3 1.1 6.2L12 17.2l-5.5 3 1.1-6.2L3.1 9.7l6.2-.8L12 3.2Z"/>'
  ),
  eye: icon('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  arrow: icon('<path d="M4 12h15M13 6l6 6-6 6"/>'),
  chevron: icon('<path d="m6 9 6 6 6-6"/>'),
  swap: icon('<path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3"/>'),
  close: icon('<path d="M6 6l12 12M18 6 6 18"/>'),
};

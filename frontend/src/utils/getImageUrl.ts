export const ImagePath = {
  TESTAMENTS: 'testaments',
  USERS: 'users',
  ECOMMERCE: 'e-commerce',
  PROFILE: 'profile',
  BLOG: 'blog'
} as const;

// ==============================|| NEW URL - GET IMAGE URL ||============================== //

export type ImagePathType = (typeof ImagePath)[keyof typeof ImagePath];

export function getImageUrl(name: string, path: ImagePathType | string) {
  return new URL(`/src/assets/images/${path}/${name}`, import.meta.url).href;
}

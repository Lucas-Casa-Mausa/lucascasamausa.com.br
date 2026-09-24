export const SITE_URL = 'https://lucascasamausa.com.br';

export const PERSON = {
  name: 'Lucas Casa Mausa',
  jobTitle: 'Software Engineer',
  city: 'São Paulo',
  email: 'lucascasamausa000@gmail.com',
  linkedin: 'https://www.linkedin.com/in/lucas-casa-mausa',
  github: 'https://github.com/Lucas-Casa-Mausa',
} as const;

/**
 * Foto do "Sobre" em /public. O original tem 400×400: a exibição é limitada a 400px para não ampliar.
 * Para trocar por uma maior: substitua o arquivo e atualize width/height.
 */
export const ABOUT_PHOTO: { src: string; width: number; height: number } | null = {
  src: '/images/lucas.jpg',
  width: 400,
  height: 400,
};

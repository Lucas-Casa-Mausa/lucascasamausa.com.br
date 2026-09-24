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
 * Foto do "Sobre" em /public. Enquanto for null, a seção mostra o monograma.
 * Para ativar: salve a foto em public/images/ e preencha src/width/height reais (exibição limitada a 400px).
 */
export const ABOUT_PHOTO: { src: string; width: number; height: number } | null = null;

import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

// Site 100% SSG, sem revalidação: o cache lê o pré-renderizado direto dos static assets (sem R2).
// Não ligar `enableCacheInterception`: ele serve a página inteira para o prefetch por segmento do Next 16,
// o cliente descarta e refaz o pedido em loop (dezenas de requisições por segundo por aba aberta).
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});

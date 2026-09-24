import { getTranslations } from 'next-intl/server';

/** Carimbo de desenho técnico no canto da prancha. Puramente decorativo. */
export async function TitleBlock({ slug }: { slug: string }) {
  const t = await getTranslations('work');
  const rows: [string, string][] = [
    ['Proj.', slug],
    [t('scale'), '1:1'],
    [t('revision'), 'A'],
  ];
  return (
    <dl
      aria-hidden="true"
      className="mt-8 ml-auto grid w-fit grid-cols-2 border-t-[1.5px] border-l-[1.5px] border-ink font-mono text-[10px] uppercase"
    >
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="border-r border-b border-ink px-2 py-1">{k}</dt>
          <dd className="border-r-[1.5px] border-b border-ink px-2 py-1">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

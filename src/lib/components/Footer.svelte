<script lang="ts">
		const year = new Date().getFullYear();

	const groups = [
		{
			title: 'Navigate',
			links: [
				{ text: 'Home', url: '/' },
				{ text: 'Quran Radio', url: '/radio' },
				{ text: 'Reciters', url: '/reciters' },
				{ text: 'About', url: '/about-us' },
				{ text: 'Developers', url: '/developers' },
				{ text: 'Product Updates', url: '/product-updates' },
				{ text: 'Feedback', url: 'https://feedback.quran.com/', external: true },
				{ text: 'Help', url: '/support' }
			]
		},
		{
			title: 'Our Projects',
			links: [
				{ text: 'Quran.com', url: 'https://quran.com', external: true },
				{
					text: 'Quran For Android',
					url: 'https://play.google.com/store/apps/details?id=com.quran.labs.androidquran',
					external: true
				},
				{
					text: 'Quran iOS',
					url: 'https://apps.apple.com/us/app/quran-by-quran-com-%D9%82%D8%B1%D8%A2%D9%86/id1118663303',
					external: true
				},
				{ text: 'QuranReflect.com', url: 'https://quranreflect.com', external: true },
				{ text: 'Sunnah.com', url: 'https://sunnah.com', external: true },
				{ text: 'Nuqayah.com', url: 'https://nuqayah.com', external: true },
				{ text: 'Legacy.Quran.com', url: 'https://legacy.quran.com', external: true },
				{ text: 'Corpus.Quran.com', url: 'https://corpus.quran.com', external: true }
			],
			description: ''
		},
		{
			title: 'Popular Links',
			links: [
				{ text: 'Ayat ul Kursi', url: '/2/255' },
				{ text: 'Surah Yaseen', url: '/36' },
				{ text: 'Surah Al-Mulk', url: '/67' },
				{ text: 'Surah Ar-Rahman', url: '/55' },
				{ text: 'Surah Al-Waqi‘ah', url: '/56' },
				{ text: 'Surah Al-Kahf', url: '/18' },
				{ text: 'Surah Al-Muzzammil', url: '/73' }
			]
		}
	];
</script>

<footer class="border-t border-base-200 bg-base-200/40 mt-12">
	<div class="max-w-6xl mx-auto px-4 py-10">
		<!-- Title + Description + Links -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
			<div class="md:col-span-1">
				<div class="flex items-center gap-3 mb-3">
					<span style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 1.5rem; letter-spacing: -0.01em;">Quran.bid</span>
				</div>
				<p class="text-sm text-base-content/70 leading-relaxed">
					A SvelteKit rewrite of <a href="https://quran.com" target="_blank" rel="noreferrer" class="underline hover:text-primary">Quran.com</a>, built for the web.
				</p>
			</div>

			{#each groups as g (g.title)}
				<div>
					<div class="text-xs font-semibold uppercase tracking-wide text-base-content/50 mb-3">{g.title}</div>
					<ul class="space-y-2">
						{#each g.links as l (l.url)}
							<li>
								<a
									href={l.url}
									target={l.external ? '_blank' : undefined}
									rel={l.external ? 'noreferrer' : undefined}
									class="text-sm text-base-content/80 hover:text-primary no-underline"
								>{l.text}</a>
							</li>
						{/each}
					</ul>
					{#if g.description}
						<p class="text-xs text-base-content/50 mt-3 leading-relaxed">{g.description}</p>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Bottom section -->
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-base-300">
			<div>
				<div class="flex flex-wrap gap-4 text-xs mb-2">
					<a href="/sitemap.xml" target="_blank" rel="noreferrer" class="text-base-content/70 hover:text-primary no-underline">Sitemap</a>
					<a href="/privacy" class="text-base-content/70 hover:text-primary no-underline">Privacy</a>
					<a href="/terms" class="text-base-content/70 hover:text-primary no-underline">Terms and Conditions</a>
				</div>
				<div class="text-xs text-base-content/60">
					&copy; {year} <a href="https://quran.bid" class="text-primary hover:underline">Quran.bid</a>. All rights reserved.
				</div>
			</div>
			<div class="flex flex-col items-center md:items-end gap-1">
				<a
					href="https://github.com/2u841r"
					target="_blank"
					rel="noreferrer"
					class="flex items-center gap-2 text-xs text-base-content/70 hover:text-primary no-underline"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18.92-.26 1.91-.39 2.89-.39s1.97.13 2.89.39c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
					<span>Built by <span class="font-semibold">Zubair Ibn Zamir</span></span>
				</a>
				<div class="flex flex-col items-center gap-0.5 text-[0.65rem] text-base-content/50 mt-1 w-full">
					<span class="uppercase tracking-wide">Thanks to</span>
					<div class="flex items-center gap-1">
						<a href="https://github.com/rich-harris" target="_blank" rel="noreferrer" class="hover:text-primary no-underline">Rich Harris</a>
						<span>for</span>
						<a href="https://svelte.dev/" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 hover:text-primary no-underline">
							<img src="https://svelte.dev/favicon.png" alt="" class="w-3.5 h-3.5" />
							<span>Svelte</span>
						</a>
					</div>
					<div class="flex items-center gap-1">
						<a href="https://github.com/saadeghi" target="_blank" rel="noreferrer" class="hover:text-primary no-underline">Pouya Saadeghi</a>
						<span>for</span>
						<a href="https://daisyui.com/" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 hover:text-primary no-underline">
							<img src="https://img.daisyui.com/images/daisyui/daisyui-logo-192.png" alt="" class="w-3.5 h-3.5 rounded" />
							<span>DaisyUI</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>

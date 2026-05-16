<script lang="ts">
	import ThemeSwitcher from './ThemeSwitcher.svelte';

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
			description: 'Funded by the Quran Foundation.'
		},
		{
			title: 'Popular Links',
			links: [
				{ text: 'Ayat ul Kursi', url: '/2?startingVerse=255' },
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
					<img src="/icons/quran-text-logo.svg" alt="Quran.com" class="h-10" />
				</div>
				<p class="text-sm text-base-content/70 leading-relaxed">
					Quran.com (also known as The Noble Quran, Al Quran, Holy Quran) is a Sadaqah Jariyah by the
					<a href="https://quran.foundation" target="_blank" rel="noreferrer" class="underline hover:text-primary">Quran Foundation</a>.
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
					&copy; {year} <a href="https://quran.com" class="text-primary hover:underline">Quran.com</a>. All rights reserved.
				</div>
			</div>
			<div class="flex items-center gap-2">
				<ThemeSwitcher />
			</div>
		</div>
	</div>
</footer>

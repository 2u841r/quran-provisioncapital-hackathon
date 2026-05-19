class NavbarState {
	visible = $state(true);
	bannerVisible = $state(true);
	reciterDrawerOpen = $state(false);

	// Tailwind spacing units (1 unit = 4px)
	get bannerH() { return this.bannerVisible ? 8 : 0; }  // 32px or 0
	get navbarTop() { return this.bannerH; }
	get contextBarTop() {
		return this.visible ? this.bannerH + 12 : this.bannerH;
	}
}

export const navbarState = new NavbarState();

// Shared UI state for global overlays. Components that open drawers/modals
// increment scrollLockCount; layout locks <html>/<body> overflow while > 0.
class UiState {
	scrollLockCount = $state(0);

	lockScroll() { this.scrollLockCount++; }
	unlockScroll() { this.scrollLockCount = Math.max(0, this.scrollLockCount - 1); }
}

export const uiState = new UiState();

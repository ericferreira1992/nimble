
/**
 * Return true when application is running in pre-rendering stage (pre-render building)
 */
export function inPreRenderingStage(): boolean {
	return 'pre-rendering' in window;
}
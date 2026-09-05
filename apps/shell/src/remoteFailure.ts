export type RemoteName = 'people' | 'delivery';

/** User-facing copy for an isolated remote failure panel. */
export function formatRemoteFailureMessage(
  remoteName: RemoteName,
  detail: string,
): { title: string; detail: string; isolationNote: string } {
  return {
    title: `${remoteName} failed to load`,
    detail,
    isolationNote: 'Shell remains available. Other remotes are unaffected.',
  };
}

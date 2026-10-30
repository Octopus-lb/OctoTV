export type PlaybackAssetRights = {
  providerKey: string;
  status: string;
  licenseStartsAt: Date | null;
  licenseEndsAt: Date | null;
};

/** Verify a registered asset is active, provider-owned, and inside its license window. */
export function isPlaybackAssetAuthorized(
  asset: PlaybackAssetRights,
  providerId: string,
  nowMs = Date.now(),
): boolean {
  if (asset.providerKey !== providerId || asset.status !== "active") return false;
  if (asset.licenseStartsAt && asset.licenseStartsAt.getTime() > nowMs) return false;
  if (asset.licenseEndsAt && asset.licenseEndsAt.getTime() <= nowMs) return false;
  return true;
}

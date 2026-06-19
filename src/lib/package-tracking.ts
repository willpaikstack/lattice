export type PackageTrackingLink = {
  carrier: string;
  href: string;
  trackingNumber: string;
};

function cleanTrackingNumber(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function carrierForTrackingNumber(trackingNumber: string) {
  const normalized = trackingNumber.toUpperCase();

  if (/^1Z[A-Z0-9]{16}$/.test(normalized)) {
    return {
      carrier: "UPS",
      href: `https://www.ups.com/track?tracknum=${encodeURIComponent(normalized)}`,
    };
  }

  if (/^\d{12}$|^\d{15}$|^\d{20}$|^\d{22}$/.test(normalized)) {
    return {
      carrier: "FedEx",
      href: `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(normalized)}`,
    };
  }

  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(normalized)) {
    return {
      carrier: "USPS / international post",
      href: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(normalized)}`,
    };
  }

  if (/^\d{10}$/.test(normalized)) {
    return {
      carrier: "DHL",
      href: `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(normalized)}`,
    };
  }

  return {
    carrier: "Carrier tracking",
    href: `https://www.google.com/search?q=${encodeURIComponent(`${normalized} package tracking`)}`,
  };
}

export function packageTrackingLink(value: string | null | undefined): PackageTrackingLink | null {
  if (!value) {
    return null;
  }

  const trackingNumber = cleanTrackingNumber(value);

  if (!trackingNumber) {
    return null;
  }

  const tracking = carrierForTrackingNumber(trackingNumber);
  return {
    ...tracking,
    trackingNumber,
  };
}

export interface DeviceCapabilities {
  readonly isLowEndDevice: boolean;
}

// deviceMemory and connection are Chromium-only hints, so both are optional.
interface NavigatorWithHints extends Navigator {
  readonly deviceMemory?: number;
  readonly connection?: { readonly saveData?: boolean };
}

const VERY_LOW_CORE_COUNT = 2;
const VERY_LOW_MEMORY_GB = 2;
const MODEST_CORE_COUNT = 4;
const MODEST_MEMORY_GB = 4;

export function detectDeviceCapabilities(): DeviceCapabilities {
  try {
    const hints = navigator as NavigatorWithHints;
    const coreCount = hints.hardwareConcurrency ?? Number.POSITIVE_INFINITY;
    const memoryGb = hints.deviceMemory ?? Number.POSITIVE_INFINITY;
    const isSavingData = hints.connection?.saveData === true;
    const isVeryLimited = coreCount <= VERY_LOW_CORE_COUNT || memoryGb <= VERY_LOW_MEMORY_GB;
    const isModestOnBoth = coreCount <= MODEST_CORE_COUNT && memoryGb <= MODEST_MEMORY_GB;
    return { isLowEndDevice: isSavingData || isVeryLimited || isModestOnBoth };
  } catch {
    return { isLowEndDevice: true };
  }
}

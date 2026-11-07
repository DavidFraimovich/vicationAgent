import { loadConfig } from "./config.js";

export type LodgingTier = "simple" | "standard" | "pamper";

export type LodgingAssessmentInput = {
  totalPriceIls: number;
  nights: number;
  tier: LodgingTier;
  rentalCarActive: boolean;
  parkingVerified?: boolean;
  parkingCostIls?: number;
  towelsIncluded?: boolean;
  linensIncluded?: boolean;
  privateBathroom?: boolean;
  cleanlinessVerified?: boolean;
  allFeesKnown?: boolean;
  cancellationTermsVerified?: boolean;
  fullRefundCancellationHoursBeforeCheckIn?: number;
  fullRefundIncludesFees?: boolean;
  refundToOriginalPaymentMethod?: boolean;
  spaAvailable?: boolean;
  spaIncluded?: boolean;
  spaExtraCostIls?: number;
  spaPrivate?: boolean;
};

type LodgingPolicy = {
  budgets_ils_per_room_night: {
    simple: { target: number; maximum: number };
    standard: { target_minimum: number; target_maximum: number; maximum: number };
    pamper: { target_minimum: number; maximum: number };
    absolute_maximum: number;
  };
  cancellation: {
    maximum_hours_before_check_in_for_full_refund: number;
  };
};

export function evaluateLodgingCandidate(input: LodgingAssessmentInput): {
  eligible: boolean;
  nightlyPriceIls: number;
  tierMaximumIls: number;
  absoluteMaximumIls: number;
  reasons: string[];
  warnings: string[];
} {
  if (!Number.isFinite(input.totalPriceIls) || input.totalPriceIls < 0) {
    throw new Error("totalPriceIls must be a non-negative number");
  }
  if (!Number.isInteger(input.nights) || input.nights <= 0) {
    throw new Error("nights must be a positive integer");
  }
  if (
    input.fullRefundCancellationHoursBeforeCheckIn !== undefined
    && (
      !Number.isFinite(input.fullRefundCancellationHoursBeforeCheckIn)
      || input.fullRefundCancellationHoursBeforeCheckIn < 0
    )
  ) {
    throw new Error("fullRefundCancellationHoursBeforeCheckIn must be non-negative");
  }

  const lodging = loadConfig().lodging as unknown as LodgingPolicy;
  const budgets = lodging.budgets_ils_per_room_night;
  const tierMaximumIls = budgets[input.tier].maximum;
  const absoluteMaximumIls = budgets.absolute_maximum;
  const parkingCostIls = input.parkingCostIls ?? 0;
  const spaExtraCostIls = input.spaExtraCostIls ?? 0;
  const nightlyPriceIls = Math.round(
    ((input.totalPriceIls + parkingCostIls + spaExtraCostIls) / input.nights) * 100,
  ) / 100;

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (nightlyPriceIls > absoluteMaximumIls) {
    reasons.push(`All-in nightly price exceeds the ₪${absoluteMaximumIls} absolute maximum.`);
  } else if (nightlyPriceIls > tierMaximumIls) {
    reasons.push(`All-in nightly price exceeds the ₪${tierMaximumIls} ${input.tier} maximum.`);
  }

  if (input.towelsIncluded !== true) reasons.push("Towels are not verified as included.");
  if (input.linensIncluded !== true) reasons.push("Bed linens are not verified as included.");
  if (input.privateBathroom !== true) reasons.push("A private bathroom is not verified.");
  if (input.cleanlinessVerified !== true) {
    reasons.push("Cleanliness is not verified by current listing details or recent reviews.");
  }
  if (input.allFeesKnown !== true) reasons.push("The all-in price and fees are not verified.");

  if (input.cancellationTermsVerified !== true) {
    reasons.push("The cancellation terms are not verified for the selected dates and rate.");
  }
  if (input.fullRefundCancellationHoursBeforeCheckIn === undefined) {
    reasons.push("The full-refund cancellation deadline is unknown.");
  } else if (
    input.fullRefundCancellationHoursBeforeCheckIn
    > lodging.cancellation.maximum_hours_before_check_in_for_full_refund
  ) {
    reasons.push(
      "Full-refund cancellation is required through 24 hours before local check-in.",
    );
  }
  if (input.fullRefundIncludesFees !== true) {
    reasons.push("Full refund does not include all prepaid lodging, cleaning, and service fees.");
  }
  if (input.refundToOriginalPaymentMethod !== true) {
    reasons.push("Refund to the original payment method is not verified.");
  }

  if (input.rentalCarActive && input.parkingVerified !== true) {
    reasons.push("Parking is not verified for dates when the rental car is active.");
  }

  if (input.tier === "pamper") {
    if (input.spaAvailable !== true) {
      reasons.push("The pamper tier requires a verified hot tub, jacuzzi, sauna, or spa.");
    }
    if (input.spaIncluded !== true && input.spaExtraCostIls === undefined) {
      reasons.push("The spa or hot-tub surcharge is unknown.");
    }
    if (input.spaAvailable && input.spaPrivate !== true) {
      warnings.push("The spa is shared or its privacy is not verified.");
    }
  }

  if (input.rentalCarActive && parkingCostIls > 0) {
    warnings.push(`Paid parking adds ₪${parkingCostIls.toFixed(2)} to the stay.`);
  }
  if (input.tier === "pamper" && spaExtraCostIls > 0) {
    warnings.push(`Spa access adds ₪${spaExtraCostIls.toFixed(2)} to the stay.`);
  }

  return {
    eligible: reasons.length === 0,
    nightlyPriceIls,
    tierMaximumIls,
    absoluteMaximumIls,
    reasons,
    warnings,
  };
}

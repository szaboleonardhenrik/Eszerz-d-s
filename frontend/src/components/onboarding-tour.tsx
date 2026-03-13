"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";

interface TourStep {
  selector: string;
  fallbackSelectors?: string[];
  titleKey: string;
  textKey: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: 'a[href="/create"]',
    titleKey: "tour.newContract",
    textKey: "tour.newContractDesc",
  },
  {
    selector: 'input[placeholder]',
    fallbackSelectors: ['input[type="search"]'],
    titleKey: "tour.search",
    textKey: "tour.searchDesc",
  },
  {
    selector: '[data-tour="notifications"]',
    fallbackSelectors: ['button svg path[d*="M15 17h5l-1.405"]'],
    titleKey: "tour.notifications",
    textKey: "tour.notificationsDesc",
  },
  {
    selector: '[data-tour="theme-toggle"]',
    fallbackSelectors: ['button:has(svg path[d*="M20.354"])'],
    titleKey: "tour.themeSwitch",
    textKey: "tour.themeSwitchDesc",
  },
  {
    selector: 'a[href="/settings"]',
    titleKey: "shortcuts.settings",
    textKey: "tour.settingsDesc",
  },
];

const LS_KEY = "onboarding_tour_completed";
const LS_ONBOARDING_KEY = "onboarding_completed";

function findElement(step: TourStep): Element | null {
  const el = document.querySelector(step.selector);
  if (el) return el;

  if (step.fallbackSelectors) {
    for (const sel of step.fallbackSelectors) {
      try {
        const fallback = document.querySelector(sel);
        if (fallback) return fallback;
      } catch {
        // invalid selector, skip
      }
    }
  }
  return null;
}

export default function OnboardingTour() {
  const { t } = useI18n();
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; arrowSide: "top" | "bottom" }>({ top: 0, left: 0, arrowSide: "top" });
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Determine valid steps (elements that exist)
  const [validSteps, setValidSteps] = useState<number[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if tour should show
  useEffect(() => {
    if (!mounted) return;
    const tourDone = localStorage.getItem(LS_KEY);
    const onboardingDone = localStorage.getItem(LS_ONBOARDING_KEY);
    if (onboardingDone && !tourDone) {
      // Small delay to let UI render
      const timer = setTimeout(() => {
        const valid: number[] = [];
        TOUR_STEPS.forEach((step, i) => {
          if (findElement(step)) valid.push(i);
        });
        if (valid.length > 0) {
          setValidSteps(valid);
          setCurrentStep(0);
          setActive(true);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const actualStep = validSteps[currentStep] ?? 0;
  const stepData = TOUR_STEPS[actualStep];

  // Position the highlight and tooltip
  const updatePosition = useCallback(() => {
    if (!active || validSteps.length === 0) return;

    const step = TOUR_STEPS[validSteps[currentStep]];
    if (!step) return;

    const el = findElement(step);
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    setRect(elRect);

    // Calculate tooltip position
    const tooltipWidth = 340;
    const tooltipHeight = 200;
    const padding = 16;

    let top: number;
    let arrowSide: "top" | "bottom" = "top";

    // Prefer below the element
    if (elRect.bottom + padding + tooltipHeight < window.innerHeight) {
      top = elRect.bottom + padding;
      arrowSide = "top";
    } else {
      top = elRect.top - padding - tooltipHeight;
      arrowSide = "bottom";
    }

    let left = elRect.left + elRect.width / 2 - tooltipWidth / 2;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setTooltipPos({ top, left, arrowSide });
  }, [active, currentStep, validSteps]);

  useEffect(() => {
    if (!active) return;
    updatePosition();

    const onResize = () => updatePosition();
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updatePosition);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, updatePosition]);

  const completeTour = useCallback(() => {
    localStorage.setItem(LS_KEY, "true");
    setActive(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < validSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  }, [currentStep, validSteps.length, completeTour]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  if (!mounted || !active || validSteps.length === 0) return null;

  const isLast = currentStep === validSteps.length - 1;
  const isFirst = currentStep === 0;
  const padding = 8;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
      {/* Overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - padding}
                y={rect.top - padding}
                width={rect.width + padding * 2}
                height={rect.height + padding * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: "auto", cursor: "default" }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      {/* Pulsing ring around highlighted element */}
      {rect && (
        <div
          className="absolute rounded-lg pointer-events-none"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          }}
        >
          <div
            className="absolute inset-0 rounded-lg animate-pulse"
            style={{
              boxShadow: "0 0 0 3px #198296, 0 0 20px rgba(25, 130, 150, 0.4)",
            }}
          />
          <div
            className="absolute -inset-1 rounded-lg animate-ping opacity-30"
            style={{
              border: "2px solid #198296",
              animationDuration: "1.5s",
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-[10000] w-[340px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          pointerEvents: "auto",
        }}
      >
        {/* Arrow */}
        <div
          className="absolute w-3 h-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rotate-45"
          style={{
            ...(tooltipPos.arrowSide === "top"
              ? { top: -6, borderTop: "1px solid", borderLeft: "1px solid" }
              : { bottom: -6, borderBottom: "1px solid", borderRight: "1px solid" }),
            left: rect ? Math.min(Math.max(rect.left + rect.width / 2 - tooltipPos.left, 20), 320) : 170,
          }}
        />

        <div className="p-5">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: "#198296" }}
              >
                {currentStep + 1}
              </span>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                / {validSteps.length}
              </span>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {validSteps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i > currentStep ? "bg-gray-200 dark:bg-gray-600" : ""
                  }`}
                  style={{
                    backgroundColor: i <= currentStep ? "#198296" : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
            {stepData ? t(stepData.titleKey) : ""}
          </h3>

          {/* Text */}
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {stepData ? t(stepData.textKey) : ""}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {t("tour.skip")}
            </button>
            <div className="flex gap-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {t("tour.previous")}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-colors"
                style={{ backgroundColor: "#198296" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#146d7d")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#198296")}
              >
                {isLast ? t("tour.finish") : t("tour.next")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

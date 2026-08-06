import { useState } from "react";
import { Check, Lock } from "lucide-react";
import {
  BADGES,
  BADGE_TIER_LABEL,
  TITLES,
  requirementProgress,
  type CosmeticContext,
} from "@/game/cosmetics";
import { Sheet } from "./Sheet";
import { ChromeCard } from "./ArcUI";

type Tab = "titles" | "badges";

const TIER_ACCENT: Record<string, string> = {
  bronze: "text-[#e8a06a]",
  silver: "text-arcade-text",
  gold: "text-neon-gold",
  diamond: "text-neon-purple",
};

interface CollectionHubScreenProps {
  open: boolean;
  cosmetics: CosmeticContext;
  unlockedTitleIds: string[];
  unlockedBadgeIds: string[];
  equippedTitleId: string;
  equippedBadgeId: string | null;
  boardsUnlocked: number;
  boardsTotal: number;
  onEquipTitle: (id: string) => void;
  onEquipBadge: (id: string | null) => void;
  onOpenBoards: () => void;
  onClose: () => void;
}

/** One home for every cosmetic: titles, badges and a link to boards. */
export function CollectionHubScreen({
  open,
  cosmetics,
  unlockedTitleIds,
  unlockedBadgeIds,
  equippedTitleId,
  equippedBadgeId,
  boardsUnlocked,
  boardsTotal,
  onEquipTitle,
  onEquipBadge,
  onOpenBoards,
  onClose,
}: CollectionHubScreenProps) {
  const [tab, setTab] = useState<Tab>("titles");

  return (
    <Sheet open={open} title="Collection" onClose={onClose}>
      <p className="ui-body text-[15px] text-arcade-muted">
        {unlockedTitleIds.length}/{TITLES.length} titles · {unlockedBadgeIds.length}/
        {BADGES.length} badges · {boardsUnlocked}/{boardsTotal} boards
      </p>

      <div className="mt-4 flex gap-2" role="tablist" aria-label="Collection sections">
        {(["titles", "badges"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`ui-title flex-1 rounded-full px-3 py-2 text-[11px] tracking-[0.18em] ${
              tab === t ? "bg-logo-green text-arcade-bg-deep" : "bg-arcade-surface text-arcade-muted"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "titles" && (
        <ul className="mt-4 grid gap-2.5">
          {TITLES.map((title) => {
            const unlocked = unlockedTitleIds.includes(title.id);
            const equipped = equippedTitleId === title.id;
            const p = requirementProgress(title.requirement, cosmetics);
            return (
              <li key={title.id}>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onEquipTitle(title.id)}
                  className="btn-arc chrome-card w-full text-left disabled:opacity-70"
                >
                  <span className="chrome-face block px-4 py-3">
                    <span className="flex items-center justify-between gap-3">
                      <span
                        className={`ui-title text-[12px] tracking-[0.2em] ${
                          unlocked ? "text-neon-gold" : "text-arcade-muted"
                        }`}
                      >
                        {title.name}
                      </span>
                      {equipped ? (
                        <span className="ui-title flex items-center gap-1 text-[10px] tracking-[0.16em] text-logo-green">
                          <Check className="size-3.5" aria-hidden /> EQUIPPED
                        </span>
                      ) : (
                        !unlocked && <Lock className="size-4 text-arcade-muted" aria-hidden />
                      )}
                    </span>
                    <span className="ui-body mt-1 block text-[14px] text-arcade-muted">
                      {title.description}
                      {!unlocked && ` — ${Math.min(p.value, p.target)}/${p.target}`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "badges" && (
        <>
          <button
            type="button"
            onClick={() => onEquipBadge(null)}
            className="ui-title mt-4 w-full rounded-full bg-arcade-surface px-3 py-2 text-[11px] tracking-[0.16em] text-arcade-muted"
          >
            NO BADGE
          </button>
          <ul className="mt-3 grid gap-2.5">
            {BADGES.map((badge) => {
              const unlocked = unlockedBadgeIds.includes(badge.id);
              const equipped = equippedBadgeId === badge.id;
              const p = requirementProgress(badge.requirement, cosmetics);
              return (
                <li key={badge.id}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => onEquipBadge(badge.id)}
                    className="btn-arc chrome-card w-full text-left disabled:opacity-70"
                  >
                    <span className="chrome-face block px-4 py-3">
                      <span className="flex items-center justify-between gap-3">
                        <span className="ui-body-tight text-[15px] font-bold text-arcade-text">
                          {badge.name}
                        </span>
                        <span
                          className={`ui-title text-[10px] tracking-[0.18em] ${
                            unlocked ? TIER_ACCENT[badge.tier] : "text-arcade-muted"
                          }`}
                        >
                          {BADGE_TIER_LABEL[badge.tier].toUpperCase()}
                        </span>
                      </span>
                      <span className="ui-body mt-1 block text-[14px] text-arcade-muted">
                        {badge.description}
                        {!unlocked && ` — ${Math.min(p.value, p.target)}/${p.target}`}
                      </span>
                      {equipped && (
                        <span className="ui-title mt-1.5 flex items-center gap-1 text-[10px] tracking-[0.16em] text-logo-green">
                          <Check className="size-3.5" aria-hidden /> EQUIPPED
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <button
        type="button"
        onClick={onOpenBoards}
        className="btn-arc chrome-card mt-5 w-full text-left"
      >
        <span className="chrome-face block px-4 py-3">
          <span className="ui-title text-[10px] tracking-[0.24em] text-neon-purple">BOARDS</span>
          <span className="ui-body mt-1 block text-[14px] text-arcade-muted">
            {boardsUnlocked} of {boardsTotal} environments unlocked. Tap to browse and equip.
          </span>
        </span>
      </button>
    </Sheet>
  );
}

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_BOARD_ID } from "@/game/boards";

interface ActiveBoard {
  boardId: string;
  effectsEnabled: boolean;
  reducedMotion: boolean;
}

const FALLBACK: ActiveBoard = {
  boardId: DEFAULT_BOARD_ID,
  effectsEnabled: true,
  reducedMotion: false,
};

const BoardContext = createContext<ActiveBoard>(FALLBACK);

/** Makes the equipped board available to every backdrop without prop drilling. */
export function BoardProvider({
  boardId,
  effectsEnabled,
  reducedMotion,
  children,
}: ActiveBoard & { children: ReactNode }) {
  const value = useMemo(
    () => ({ boardId, effectsEnabled, reducedMotion }),
    [boardId, effectsEnabled, reducedMotion],
  );
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useActiveBoard(): ActiveBoard {
  return useContext(BoardContext);
}

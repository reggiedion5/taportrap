# Center the icons in the square Home header buttons

## What's wrong

The bell (notifications) and gear (settings) buttons on the Home header render their glyph
slightly left of center inside the chrome square.

Cause: the shared button primitive always renders two items inside its face — the icon and a
text span — separated by a fixed gap. For these icon-only buttons the label is screen-reader
only, so the text span is empty and invisible, but the gap (about 9px) still occupies layout
and shifts the icon left by roughly half that amount.

## The fix

1. Add an explicit icon-only mode to the button primitive in `src/components/game/ArcUI.tsx`:
   when enabled, the face uses no gap and the (screen-reader) label span is not rendered as an
   in-flow item, so the icon is the only sizing child and centers exactly.
2. Use that mode for the two Home header buttons in `src/components/game/HomeScreen.tsx`
   (notifications and settings), keeping their existing `aria-label`, unread badge, and
   `size-11` square face.
3. Scan the other screens for the same icon-only button pattern (back buttons and header
   actions in the sheet/screen components) and apply the same mode where a button has an icon
   plus only a screen-reader label, so all square icon buttons center consistently.

## Technical notes

- Change is presentation only: no gameplay, scoring, progression, routing, or state changes.
- Accessibility is preserved — the visually hidden label stays in the DOM for screen readers,
  it just no longer contributes flex spacing.
- Verify with an element screenshot of both header buttons at mobile width, before and after.

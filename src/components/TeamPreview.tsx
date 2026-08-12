// Team DOM preview. Mirrors lib/teamExport.ts so the team download
// is what the user sees. Cohesive group composition:
//   1. header band    (200) – HH brand, dates, ticket stub
//   2. goa scene      (160) – mountain ridge + palms + sun
//   3. crew zone      (470) – 3 portraits in a unified row
//   4. name strip     (180) – wavy top, 3 names with ⚡ accents
//   5. class strip    (160) – pink, 3 builder class titles
//   6. footer         (~180 -> 90 effective) – dense postcard footer

import React, { forwardRef, useMemo } from 'react';
import {
  CARD_W,
  CARD_H,
  COLORS,
  FONT,
  type CropAdjust,
} from '../lib/posterLayout';
import { DEFAULT_ADJUST, computeCoverLayout } from '../lib/image';

export type TeamMemberInput = {
  name: string;
  stackOrRole: string;
  builderClass: string;
  photo: HTMLImageElement | null;
  adjust?: CropAdjust;
  builderNumber?: number;
};

type Props = {
  teamName: string;
  members: TeamMemberInput[];
  size?: number;
  className?: string;
};

const HEADER_H = 200;
const GOA_H = 160;
const CREW_TOP = HEADER_H + GOA_H;
const CREW_H = 470;
const CREW_BOTTOM = CREW_TOP + CREW_H;
const NAME_H = 180;
const NAME_TOP = CREW_BOTTOM;
const CLASS_H = 160;
const CLASS_TOP = NAME_TOP + NAME_H;
const FOOTER_H = CARD_H - (CLASS_TOP + CLASS_H);
const FOOTER_TOP = CARD_H - FOOTER_H;

export const TeamPreview = forwardRef<HTMLDivElement, Props>(function TeamPreview(
  { teamName, members, size = CARD_W, className = '' },
  ref,
) {
  const padded = [0, 1, 2].map((i) => members[i] ?? null);
  const grain = useMemo(() => makeGrainDots(), []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: size,
        height: size * (CARD_H / CARD_W),
        background: COLORS.cream,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CARD_W,
          height: CARD_H,
          transformOrigin: 'top left',
          transform: `scale(${size / CARD_W})`,
          backgroundImage: grain,
          backgroundColor: COLORS.cream,
        }}
      >
        {/* Outer dark-green frame */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: `inset 0 0 0 10px ${COLORS.ink}, inset 0 0 0 12px ${COLORS.cream}`,
            pointerEvents: 'none',
          }}
        />

        <TeamHeader teamName={teamName} count={members.length} firstBuilderNo={members[0]?.builderNumber} />
        <TeamGoaScene />
        <TeamCrew members={padded} />
        <TeamNameStrip members={padded} />
        <TeamClassStrip members={padded} />
        <TeamFooter />
      </div>
    </div>
  );
});

// -------------------- grain --------------------

function makeGrainDots() {
  const dots: { x: number; y: number; r: number }[] = [];
  let s = 1337;
  for (let i = 0; i < 1100; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = (s / 233280) * 100;
    s = (s * 9301 + 49297) % 233280;
    const y = (s / 233280) * 100;
    s = (s * 9301 + 49297) % 233280;
    const r = 0.4 + (s / 233280) * 1.2;
    dots.push({ x, y, r });
  }
  return dots
    .map(
      (d) =>
        `radial-gradient(circle, rgba(58,42,20,0.05) ${d.r}px, transparent ${d.r + 0.5}px) ${d.x}% ${d.y}% / 100% 100%`,
    )
    .join(', ');
}

// -------------------- header --------------------

function TeamHeader({
  teamName,
  count,
  firstBuilderNo,
}: {
  teamName: string;
  count: number;
  firstBuilderNo?: number;
}) {
  const tagSize = 110;
  const builderNo = String(firstBuilderNo ?? 28).padStart(3, '0');
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CARD_W,
        height: HEADER_H,
        background: COLORS.ink,
        overflow: 'hidden',
      }}
    >
      {/* Sun-yellow HH tag */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: tagSize,
          height: tagSize,
          background: COLORS.sun,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 60,
            color: COLORS.ink,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          HH
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontWeight: 700,
            fontSize: 10,
            color: COLORS.ink,
            letterSpacing: '0.2em',
            marginTop: 4,
          }}
        >
          EST. 2026
        </div>
      </div>

      {/* Wordmark */}
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: tagSize + 30,
          fontFamily: FONT.editorialItalic,
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 54,
          color: COLORS.cream,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        Hacker House
      </div>
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: tagSize + 30,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 16,
          color: COLORS.sun,
          letterSpacing: '0.28em',
        }}
      >
        CREW · GOA · INDIA
      </div>
      <div
        style={{
          position: 'absolute',
          top: 132,
          left: tagSize + 30,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.pink,
          letterSpacing: '0.24em',
        }}
      >
        {count} BUILDERS · CURRENTLY SHIPPING · BUILD · SHIP · REPEAT
      </div>

      {/* Right-side dates */}
      <div
        style={{
          position: 'absolute',
          top: 26,
          right: 36,
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 36,
          color: COLORS.sun,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        28—31
      </div>
      <div
        style={{
          position: 'absolute',
          top: 70,
          right: 36,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 14,
          color: COLORS.cream,
          letterSpacing: '0.22em',
        }}
      >
        OCT 2026
      </div>
      <div
        style={{
          position: 'absolute',
          top: 96,
          right: 36,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.pink,
          letterSpacing: '0.22em',
        }}
      >
        GOA · INDIA
      </div>

      {/* TKT round stamp */}
      <RoundStampSVG
        cx={CARD_W - 168}
        cy={48}
        r={36}
        topLabel="TKT"
        bottomLabel={`No. ${builderNo}`}
        color={COLORS.pink}
        accent={COLORS.sun}
        outerColor={COLORS.pink}
        fontSizeTop={14}
        fontSizeBottom={10}
      />

      {/* Cream stripe with team name */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 44,
          background: COLORS.cream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: FONT.display,
            fontSize: 26,
            color: COLORS.ink,
            letterSpacing: '-0.005em',
          }}
        >
          {(teamName || 'BUILDER CREW').toUpperCase()} · CREW
        </span>
      </div>
    </div>
  );
}

// -------------------- goa scene --------------------

function TeamGoaScene() {
  const y = HEADER_H;
  const routeY = y + 130;
  const dots: number[] = [];
  for (let x = 30; x <= CARD_W - 30; x += 8) dots.push(x);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: y,
        width: CARD_W,
        height: GOA_H,
        background: COLORS.cream,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 16,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.stamp,
          letterSpacing: '0.22em',
        }}
      >
        GOA · 15.5° N · 73.8° E
      </div>
      <div
        style={{
          position: 'absolute',
          top: 18,
          right: 16,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.stamp,
          letterSpacing: '0.22em',
        }}
      >
        ARABIAN SEA
      </div>

      {/* Mountain ridge */}
      <svg
        viewBox="0 0 1080 60"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 30,
          width: '100%',
          height: 60,
        }}
      >
        <path
          d="M10 60 L130 30 L250 52 L370 20 L490 46 L630 26 L770 50 L910 32 L1070 56 L1070 60 Z"
          fill={COLORS.ink}
        />
        <path
          d="M10 56 Q210 50 410 56 T810 56 T1070 56"
          fill="none"
          stroke={COLORS.sun}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>

      <PalmSVG x={90} y={GOA_H - 6} h={90} color={COLORS.stamp} scale={1} />
      <PalmSVG x={220} y={GOA_H - 4} h={60} color={COLORS.ink} scale={0.85} />
      <PalmSVG x={CARD_W - 220} y={GOA_H - 6} h={72} color={COLORS.ink} scale={0.9} />

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 10,
          color: COLORS.pink,
          letterSpacing: '0.3em',
        }}
      >
        ROUTE · BAGA → ANJUNA → PALOLEM
      </div>

      {dots.map((x, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x - 4,
            top: routeY - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: COLORS.pink,
          }}
        />
      ))}

      <ScooterSVG cx={CARD_W * 0.55} cy={routeY} scale={1.4} color={COLORS.ink} />
    </div>
  );
}

// -------------------- crew zone --------------------

function TeamCrew({
  members,
}: {
  members: (TeamMemberInput | null)[];
}) {
  const slotW = CARD_W / 3;
  const cy = CREW_TOP + 230;
  const r = 150;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: CREW_TOP,
        width: CARD_W,
        height: CREW_H,
        background: COLORS.cream,
        overflow: 'hidden',
      }}
    >
      {/* Wave pattern */}
      <svg
        viewBox="0 0 1000 50"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 90,
          width: 'calc(100% - 40px)',
          height: 24,
          opacity: 0.6,
        }}
      >
        <path
          d="M0 12 Q100 -4 200 12 T400 12 T600 12 T800 12 T1000 12"
          fill="none"
          stroke={COLORS.pink}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>

      {/* Shared palms top-left + top-right (cross-region decoration) */}
      <PalmSVG x={60} y={90} h={130} color={COLORS.stamp} scale={1} mirrored />
      <PalmSVG x={CARD_W - 60} y={90} h={130} color={COLORS.stamp} scale={1} />

      {/* Three portrait slots */}
      {members.map((m, i) => {
        const cx = slotW * i + slotW / 2;
        return (
          <MemberSlot
            key={i}
            m={m}
            cx={cx}
            cy={cy}
            r={r}
            builderNo={m?.builderNumber ?? 28}
          />
        );
      })}

      {/* Shared postmark footer line */}
      <div
        style={{
          position: 'absolute',
          bottom: 26,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 14,
          color: COLORS.pink,
          letterSpacing: '0.3em',
        }}
      >
        ·  ANJUNA · GOA  ·
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 10,
          color: COLORS.stamp,
          letterSpacing: '0.26em',
        }}
      >
        CURRENTLY SHIPPING TOGETHER  ·  HH/GOA/26
      </div>
    </div>
  );
}

function MemberSlot({
  m,
  cx,
  cy,
  r,
  builderNo,
}: {
  m: TeamMemberInput | null;
  cx: number;
  cy: number;
  r: number;
  builderNo: number;
}) {
  const adj = m?.adjust ?? DEFAULT_ADJUST;
  const layout =
    m?.photo && m.photo.naturalWidth > 0
      ? computeCoverLayout(m.photo.naturalWidth, m.photo.naturalHeight, r * 2, r * 2, adj)
      : null;

  return (
    <>
      {/* Cream postage plate (rotated) */}
      <div
        style={{
          position: 'absolute',
          left: cx - 160,
          top: cy - 130,
          width: 320,
          height: 240,
          background: COLORS.pink,
          transform: `translate(${cx - (cx - 160) - 160}px, 0) rotate(-2.3deg)`,
          boxShadow: `inset 0 0 0 12px ${COLORS.cream}`,
        }}
      />

      {/* Sun-yellow ring */}
      <div
        style={{
          position: 'absolute',
          left: cx - r - 12,
          top: cy - r - 12,
          width: (r + 12) * 2,
          height: (r + 12) * 2,
          borderRadius: '50%',
          background: COLORS.sun,
        }}
      />

      {/* Photo circle */}
      <div
        style={{
          position: 'absolute',
          left: cx - r,
          top: cy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          overflow: 'hidden',
          background: COLORS.inkDeep,
        }}
      >
        {layout && m?.photo ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${m.photo.src})`,
              backgroundSize: `${layout.bgSizePct}%`,
              backgroundPosition: `${layout.bgPosXPct}% ${layout.bgPosYPct}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SunSVG cx={cx} cy={cy - 20} r={50} fill={COLORS.sun} ray={COLORS.sunDeep} cxAbs={false} />
            <div
              style={{
                position: 'absolute',
                top: cy + 60,
                fontFamily: FONT.mono,
                fontWeight: 700,
                fontSize: 24,
                color: COLORS.cream,
                letterSpacing: '0.3em',
              }}
            >
              PHOTO
            </div>
          </div>
        )}
      </div>

      {/* Double pink ring */}
      <div
        style={{
          position: 'absolute',
          left: cx - r - 5,
          top: cy - r - 5,
          width: (r + 5) * 2,
          height: (r + 5) * 2,
          borderRadius: '50%',
          border: `7px solid ${COLORS.pink}`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: cx - r - 18,
          top: cy - r - 18,
          width: (r + 18) * 2,
          height: (r + 18) * 2,
          borderRadius: '50%',
          border: `2px solid ${COLORS.pink}`,
          pointerEvents: 'none',
        }}
      />

      <StarSVG x={cx} y={cy - r - 18} r={10} color={COLORS.pink} />

      <RoundStampSVG
        cx={cx}
        cy={cy - r - 50}
        r={30}
        topLabel="BUILDER"
        bottomLabel={`No. ${String(builderNo).padStart(3, '0')}`}
        color={COLORS.ink}
        accent={COLORS.sun}
        outerColor={COLORS.ink}
        fontSizeTop={10}
        fontSizeBottom={13}
      />
    </>
  );
}

// -------------------- name strip --------------------

function TeamNameStrip({ members }: { members: (TeamMemberInput | null)[] }) {
  const slotW = CARD_W / 3;
  const wavyY = NAME_TOP;

  // Wavy top path
  const points: string[] = [];
  for (let x = 0; x <= CARD_W; x += 32) {
    const yy = wavyY + 18 * Math.sin((x / 64) * Math.PI * 2);
    points.push(`${x},${yy}`);
  }
  const wavyPath =
    `M0,${wavyY} ` + points.map((p) => `L${p}`).join(' ') +
    ` L${CARD_W},${CARD_H} L0,${CARD_H} Z`;

  return (
    <>
      {/* Wavy cream block */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CARD_W,
          height: CARD_H,
          pointerEvents: 'none',
        }}
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        preserveAspectRatio="none"
      >
        <path d={wavyPath} fill={COLORS.cream} />
      </svg>

      {/* Yellow vertical bar on the left */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: wavyY + 18,
          width: 14,
          height: NAME_H - 18,
          background: COLORS.sun,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 32,
          top: wavyY + 18,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.sun,
          letterSpacing: '0.26em',
        }}
      >
        HH CREW · BUILDER ID · NO. 028 / 247
      </div>

      {members.map((m, i) => {
        const cx = slotW * i + slotW / 2;
        const name = (m?.name || 'BUILDER').toUpperCase();
        const stack = (m?.stackOrRole || 'BUILDER').toUpperCase();
        const fontSize = fitAnton(name, slotW - 30, 64, 24);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: cx - fontSize * 0.55 - fontSize * 0.5,
                top: wavyY + 80,
                fontFamily: FONT.display,
                fontSize: fontSize,
                color: COLORS.sun,
                lineHeight: 1,
                width: fontSize,
                textAlign: 'center',
              }}
            >
              ⚡
            </div>
            <div
              style={{
                position: 'absolute',
                left: cx - fontSize * 0.5,
                top: wavyY + 80,
                fontFamily: FONT.display,
                fontSize: fontSize,
                color: COLORS.ink,
                letterSpacing: '-0.01em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </div>
            <div
              style={{
                position: 'absolute',
                left: cx + fontSize * 0.05,
                top: wavyY + 80,
                fontFamily: FONT.display,
                fontSize: fontSize,
                color: COLORS.pink,
                lineHeight: 1,
                width: fontSize,
                textAlign: 'center',
              }}
            >
              ⚡
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: wavyY + NAME_H - 40,
                width: slotW,
                textAlign: 'center',
                fontFamily: FONT.mono,
                fontWeight: 700,
                fontSize: 16,
                color: COLORS.ink,
                letterSpacing: '0.22em',
              }}
            >
              [ ⚡ {stack} ⚡ ]
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
}

// -------------------- class strip --------------------

function TeamClassStrip({ members }: { members: (TeamMemberInput | null)[] }) {
  const slotW = CARD_W / 3;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: CLASS_TOP,
        width: CARD_W,
        height: CLASS_H,
        background: COLORS.pink,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.editorial,
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 18,
          color: COLORS.cream,
          letterSpacing: '0.02em',
        }}
      >
        — BUILDER CLASSES —
      </div>
      <div
        style={{
          position: 'absolute',
          top: 44,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.sun,
          letterSpacing: '0.3em',
        }}
      >
        247 BUILDERS · 28—31 OCT 2026
      </div>

      {members.map((m, i) => {
        const cx = slotW * i + slotW / 2;
        const klass = (m?.builderClass || 'THE BUILDER').toUpperCase();
        const fontSize = fitAnton(klass, slotW - 24, 56, 18);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 96,
              width: slotW,
              textAlign: 'center',
              fontFamily: FONT.display,
              fontSize: fontSize,
              color: COLORS.sun,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {klass}
          </div>
        );
      })}
    </div>
  );
}

// -------------------- footer --------------------

function TeamFooter() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: FOOTER_TOP,
        width: CARD_W,
        height: FOOTER_H,
        background: COLORS.cream,
        overflow: 'hidden',
      }}
    >
      {/* Top dotted rule */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 0,
          right: 0,
          height: 2,
          backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.ink} 0 4px, transparent 4px 12px)`,
          opacity: 0.4,
        }}
      />

      {/* Left tear */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 28,
          height: FOOTER_H,
          backgroundImage: `radial-gradient(circle, ${COLORS.cream} 4px, transparent 5px)`,
          backgroundSize: '8px 16px',
          backgroundPosition: '0 0',
          backgroundColor: COLORS.ink,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: FOOTER_H / 2 - 19,
          left: 50,
          fontFamily: FONT.editorialItalic,
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 38,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        Goa
      </div>
      <div
        style={{
          position: 'absolute',
          top: FOOTER_H / 2 - 7,
          left: 138,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.pink,
          letterSpacing: '0.3em',
        }}
      >
        INDIA
      </div>

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 32,
          fontFamily: FONT.display,
          fontSize: 22,
          color: COLORS.pink,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        #FrameInGoa
      </div>
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 32,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 11,
          color: COLORS.ink,
          letterSpacing: '0.26em',
        }}
      >
        28—31 OCT 2026
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 32,
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: 10,
          color: COLORS.ink,
          letterSpacing: '0.26em',
        }}
      >
        HH / GOA / 26
      </div>

      {/* Bottom dotted rule */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: 0,
          right: 0,
          height: 2,
          backgroundImage: `repeating-linear-gradient(90deg, ${COLORS.ink} 0 3px, transparent 3px 9px)`,
          opacity: 0.35,
        }}
      />

      <PalmSVG x={CARD_W - 40} y={FOOTER_H} h={28} color={COLORS.ink} scale={0.8} />
      <BirdSVG x={CARD_W - 80} y={FOOTER_H - 30} scale={0.7} color={COLORS.ink} />
      <BirdSVG x={CARD_W - 52} y={FOOTER_H - 38} scale={0.5} color={COLORS.ink} />
    </div>
  );
}

// ============================================================================
// SVG illustration helpers (shared with BuilderIDPreview)
// ============================================================================

function fitAnton(text: string, maxWidth: number, startSize: number, minSize: number): number {
  if (typeof document === 'undefined') return startSize;
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return startSize;
  const family = FONT.display;
  let size = startSize;
  while (size > minSize) {
    ctx.font = `400 ${Math.round(size)}px ${family}`;
    let w = 0;
    for (const c of Array.from(text)) w += ctx.measureText(c).width;
    w += -0.01 * size * (text.length - 1);
    if (w <= maxWidth) return Math.round(size);
    size -= 2;
  }
  return Math.round(minSize);
}

function PalmSVG({
  x,
  y,
  h,
  color,
  scale = 1,
  mirrored = false,
}: {
  x: number;
  y: number;
  h: number;
  color: string;
  scale?: number;
  mirrored?: boolean;
}) {
  const w = 130 * scale;
  const trunkX = mirrored ? w - 65 : 65;
  const trunkTopX = mirrored ? w - 70 : 60;
  return (
    <svg
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h,
        width: w,
        height: h + 32,
        transform: mirrored ? 'scaleX(-1)' : undefined,
      }}
      viewBox={`0 0 ${w} ${h + 32}`}
    >
      <path
        d={`M${trunkX} ${h + 32} Q${trunkX + 8 * scale} ${h * 0.55} ${trunkTopX} 4`}
        fill="none"
        stroke={color}
        strokeWidth={4 * scale}
        strokeLinecap="round"
      />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = -Math.PI / 2 + ((i - 3.5) / 8) * (Math.PI * 0.95);
        const len = h * 0.55;
        const tipX = trunkTopX + Math.cos(a) * len;
        const tipY = Math.sin(a) * len;
        return (
          <path
            key={i}
            d={`M${trunkTopX} 4 Q${trunkTopX + Math.cos(a) * len * 0.5} ${Math.sin(a) * len * 0.5} ${tipX} ${tipY}`}
            fill="none"
            stroke={color}
            strokeWidth={5 * scale}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={trunkTopX - 7 * scale} cy={8} r={4 * scale} fill={color} />
      <circle cx={trunkTopX} cy={6} r={4 * scale} fill={color} />
      <circle cx={trunkTopX + 7 * scale} cy={8} r={4 * scale} fill={color} />
    </svg>
  );
}

function SunSVG({
  cx,
  cy,
  r,
  fill,
  ray,
  cxAbs = true,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  ray: string;
  cxAbs?: boolean;
}) {
  const w = r * 5.2;
  const offsetX = cxAbs ? cx : w / 2;
  const offsetY = cxAbs ? cy : cy;
  return (
    <svg
      style={{
        position: 'absolute',
        left: offsetX - w / 2,
        top: offsetY - w / 2,
        width: w,
        height: w,
      }}
      viewBox="0 0 200 200"
    >
      <circle cx={100} cy={100} r={r * 1.4} fill={fill} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 100 + Math.cos(a) * (r * 1.7);
        const y1 = 100 + Math.sin(a) * (r * 1.7);
        const x2 = 100 + Math.cos(a) * (r * 2.6);
        const y2 = 100 + Math.sin(a) * (r * 2.6);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={ray}
            strokeWidth={Math.max(3, r * 0.22)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function ScooterSVG({
  cx,
  cy,
  scale,
  color,
}: {
  cx: number;
  cy: number;
  scale: number;
  color: string;
}) {
  const w = 60 * scale;
  const h = 40 * scale;
  return (
    <svg
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
      }}
      viewBox="0 0 60 40"
    >
      <circle cx="10" cy="30" r={6 * scale} fill={color} />
      <circle cx="48" cy="30" r={6 * scale} fill={color} />
      <circle cx="10" cy="30" r={2.4 * scale} fill={COLORS.cream} />
      <circle cx="48" cy="30" r={2.4 * scale} fill={COLORS.cream} />
      <path d="M4 16 L4 6 Q4 0 10 0 L32 0 Q42 0 44 6 L44 16 Z" fill={color} />
      <rect x={12} y={-2 * scale} width={12 * scale} height={3 * scale} fill={color} />
      <line x1="36" y1="0" x2="40" y2={-6 * scale} stroke={color} strokeWidth={2.5 * scale} strokeLinecap="round" />
    </svg>
  );
}

function StarSVG({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const spikes = 5;
  const outer = r;
  const inner = r * 0.45;
  const points: string[] = [];
  let rot = -Math.PI / 2;
  for (let i = 0; i < spikes; i++) {
    points.push(`${x + Math.cos(rot) * outer},${y + Math.sin(rot) * outer}`);
    rot += Math.PI / spikes;
    points.push(`${x + Math.cos(rot) * inner},${y + Math.sin(rot) * inner}`);
    rot += Math.PI / spikes;
  }
  return (
    <svg
      style={{
        position: 'absolute',
        left: x - r - 4,
        top: y - r - 4,
        width: (r + 4) * 2,
        height: (r + 4) * 2,
      }}
      viewBox={`${x - r - 4} ${y - r - 4} ${(r + 4) * 2} ${(r + 4) * 2}`}
    >
      <polygon points={points.join(' ')} fill={color} />
    </svg>
  );
}

function RoundStampSVG({
  cx,
  cy,
  r,
  topLabel,
  bottomLabel,
  color,
  accent,
  outerColor,
  fontSizeTop = 11,
  fontSizeBottom = 15,
}: {
  cx: number;
  cy: number;
  r: number;
  topLabel: string;
  bottomLabel: string;
  color: string;
  accent: string;
  outerColor?: string;
  fontSizeTop?: number;
  fontSizeBottom?: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        border: `2.5px solid ${outerColor ?? color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: fontSizeTop,
          letterSpacing: '0.18em',
        }}
      >
        {topLabel}
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontWeight: 700,
          fontSize: fontSizeBottom,
          letterSpacing: '0.1em',
          marginTop: 3,
        }}
      >
        {bottomLabel}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: r * 0.32,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: accent,
        }}
      />
    </div>
  );
}

function BirdSVG({
  x,
  y,
  scale,
  color,
}: {
  x: number;
  y: number;
  scale: number;
  color: string;
}) {
  const w = 40 * scale;
  const h = 18 * scale;
  return (
    <svg
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
      }}
      viewBox="0 0 40 18"
    >
      <path
        d="M2 12 Q10 2 20 10 Q30 2 38 12"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

import { TeamMember } from '@/types/simulation';
import { motion } from 'framer-motion';

interface TeamCursorsProps {
  members: TeamMember[];
  currentMemberId: string;
}

export function TeamCursors({ members, currentMemberId }: TeamCursorsProps) {
  const otherMembers = members.filter(
    (m) => m.id !== currentMemberId && m.cursorPosition
  );

  return (
    <>
      {otherMembers.map((member) => (
        <motion.div
          key={member.id}
          className="fixed pointer-events-none z-50"
          initial={false}
          animate={{
            x: member.cursorPosition!.x,
            y: member.cursorPosition!.y,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        >
          {/* Cursor icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: member.color }}
          >
            <path
              d="M5 3L19 12L12 13L9 20L5 3Z"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          {/* Name label */}
          <div
            className="absolute left-5 top-5 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap"
            style={{ backgroundColor: member.color }}
          >
            {member.displayName}
          </div>
        </motion.div>
      ))}
    </>
  );
}

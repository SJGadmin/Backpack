'use client';

import { useOthers, useSelf } from '@/liveblocks.config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function L10Presence() {
  const others = useOthers();
  const self = useSelf();

  if (others.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Also here:</span>
        <div className="flex -space-x-2">
          {others.slice(0, 5).map((other) => (
            <Tooltip key={other.connectionId}>
              <TooltipTrigger asChild>
                <div
                  className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white cursor-default"
                  style={{ backgroundColor: other.info?.color || '#888' }}
                >
                  {other.info?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{other.info?.name || 'Unknown'}</p>
                {other.presence?.focusedSection && (
                  <p className="text-xs text-muted-foreground">
                    Editing: {other.presence.focusedSection}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
          {others.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium cursor-default">
                  +{others.length - 5}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{others.length - 5} more viewer(s)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// Smaller inline presence indicator for sections
export function L10SectionPresence({ section }: { section: string }) {
  const others = useOthers();
  const editingUsers = others.filter(
    (other) => other.presence?.focusedSection === section
  );

  if (editingUsers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex -space-x-1 ml-2">
        {editingUsers.slice(0, 3).map((other) => (
          <Tooltip key={other.connectionId}>
            <TooltipTrigger asChild>
              <div
                className="w-5 h-5 rounded-full border border-background flex items-center justify-center text-[10px] font-medium text-white animate-pulse cursor-default"
                style={{ backgroundColor: other.info?.color || '#888' }}
              >
                {other.info?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{other.info?.name} is editing</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

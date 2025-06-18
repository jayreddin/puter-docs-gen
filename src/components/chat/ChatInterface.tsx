import React from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { MobileChatInterface } from "./MobileChatInterface";
import { DesktopChatInterface } from "./DesktopChatInterface";

export function ChatInterface() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileChatInterface /> : <DesktopChatInterface />;
}

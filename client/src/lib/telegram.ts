import WebApp from "@twa-dev/sdk";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export const initTelegram = () => {
  WebApp.ready();
  WebApp.expand();
};

export const getTelegramProfile = () => {
  const user = WebApp.initDataUnsafe.user as TelegramUser | undefined;
  const username =
    user?.username || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || `user_${Date.now()}`;
  const telegramId = user?.id ? String(user.id) : `local_${Date.now()}`;

  return {
    telegramId,
    username,
    initData: WebApp.initData || ""
  };
};

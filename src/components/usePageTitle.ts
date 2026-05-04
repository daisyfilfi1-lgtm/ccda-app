'use client';

import { useEffect } from 'react';

const APP_NAME = 'CCDA 中文阅读';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} - ${APP_NAME}`;
  }, [title]);
}

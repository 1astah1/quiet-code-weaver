
import { useState, useEffect } from 'react';

interface WebViewInfo {
  isWebView: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export const useWebViewDetection = (): WebViewInfo => {
  const [webViewInfo, setWebViewInfo] = useState<WebViewInfo>({
    isWebView: false,
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    platform: 'unknown'
  });

  useEffect(() => {
    console.log('📱 [WEBVIEW_DETECTION] Detecting WebView environment...');
    
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    // Определяем WebView
    const isIOSWebView = isIOS && !userAgent.includes('Safari/');
    const isAndroidWebView = isAndroid && userAgent.includes('wv');
    const isWebView = isIOSWebView || isAndroidWebView;
    
    // Определяем standalone режим (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    let platform: 'ios' | 'android' | 'desktop' | 'unknown' = 'unknown';
    if (isIOS) platform = 'ios';
    else if (isAndroid) platform = 'android';
    else if (!(/Mobile|Android|iPhone|iPad/.test(userAgent))) platform = 'desktop';
    
    const info: WebViewInfo = {
      isWebView,
      isIOS,
      isAndroid,
      isStandalone,
      platform
    };
    
    console.log('📊 [WEBVIEW_DETECTION] Detection results:', info);
    setWebViewInfo(info);
  }, []);

  return webViewInfo;
};

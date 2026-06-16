import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthProvider.tsx'
import { LoadingProvider } from './context/LoadingContext.tsx'
import { ConfigsProvider } from './context/SiteConfigsProvider.tsx'
import { CompanyConfigsProvider } from './context/CompanyConfigsProvider.tsx'
import { SocketProvider } from './context/SocketProvider.tsx'
import { DarkModeProvider } from './context/DarkModeProvider.tsx'
import { POSProvider } from './context/POSProvider.tsx'
import { LanguageProvider } from './context/LanguageContext.tsx'
import { QuickBooksProvider } from './context/QuickBooksProvider.tsx'
import { SubscriptionProvider } from './context/SubscriptionContext.tsx'

createRoot(document.getElementById('root')!).render(
    <DarkModeProvider>
      <LanguageProvider>
        <ConfigsProvider>
          <CompanyConfigsProvider>
            <LoadingProvider>
              <AuthProvider>
                <SubscriptionProvider>
                <POSProvider>
                  <SocketProvider>
                    <QuickBooksProvider>
                      <App />
                    </QuickBooksProvider>
                  </SocketProvider>
                </POSProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </LoadingProvider>
          </CompanyConfigsProvider>
        </ConfigsProvider>
      </LanguageProvider>
    </DarkModeProvider>
)

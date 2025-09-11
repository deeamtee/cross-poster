import * as VKID from '@vkid/sdk';

// Modern VK ID types based on official SDK
interface VKIDLoginPayload {
  code: string;
  device_id: string;
  state?: string;
}

interface VKIDError {
  message?: string;
  type?: string;
}

interface VKIDInitConfig {
  app: number;
  redirectUrl: string;
  state?: string;
  codeVerifier?: string;
  scope?: string;
}

export class VKIDService {
  private isInitialized = false;
  private currentConfig: VKIDInitConfig | null = null;

  /**
   * Generate a cryptographically secure code verifier for PKCE
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate a secure state parameter
   */
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Initialize VK ID SDK with proper configuration
   */
  async initializeSDK(clientId: number): Promise<void> {
    // Reset SDK state to avoid conflicts
    this.reset();
    
    if (this.isInitialized && this.currentConfig?.app === clientId) {
      console.log('VK ID SDK already initialized for this client ID');
      return;
    }

    const currentOrigin = window.location.origin;
    
    // VK ID requires exact origin match with configured domains
    // According to VK ID documentation:
    // - Base domain should be 'localhost' (without port)
    // - Redirect URL should include the port: 'http://localhost:5173'
    const redirectUrl = import.meta.env.PROD 
      ? 'https://deeamtee.github.io/cross-poster/'
      : currentOrigin; // Use exact current origin for development

    // Generate secure parameters for OAuth 2.1
    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();

    const config: VKIDInitConfig = {
      app: clientId,
      redirectUrl,
      state,
      codeVerifier,
      scope: 'wall photos groups' // Space-separated as per VK ID documentation
    };

    this.currentConfig = config;

    console.log('Initializing VK ID SDK with config:', {
      app: config.app,
      redirectUrl: config.redirectUrl,
      scope: config.scope,
      hasState: !!config.state,
      hasCodeVerifier: !!config.codeVerifier,
      currentOrigin: currentOrigin
    });

    try {
      // Initialize the VK ID SDK
      VKID.Config.init(config);
      this.isInitialized = true;
      console.log('VK ID SDK initialized successfully');
    } catch (error) {
      console.error('VK ID SDK initialization error:', error);
      
      // Provide better error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid app id') || error.message.includes('app')) {
          throw new Error(`Неверный Client ID: ${clientId}. Проверьте правильность ID в настройках VK приложения.`);
        }
        
        if (error.message.includes('redirect') || error.message.includes('domain')) {
          throw new Error(`Ошибка redirect URL: Домен ${currentOrigin} не добавлен в доверенные домены VK приложения.\n\nДля исправления:\n1. Откройте id.vk.com и перейдите в ваше приложение\n2. В разделе "Базовый домен" добавьте: ${currentOrigin}\n3. В разделе "Доверенный redirect URL" добавьте: ${redirectUrl}\n4. Сохраните настройки`);
        }
      }
      
      throw new Error(`Ошибка инициализации VK ID SDK: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Authenticate user with VK ID OneTap widget
   */
  async authenticateWithOneTap(container: HTMLElement): Promise<{ accessToken: string; expiresIn: number; userId: number }> {
    if (!this.isInitialized) {
      throw new Error('VK ID SDK не инициализирован. Вызовите initializeSDK() сначала.');
    }

    return new Promise((resolve, reject) => {
      try {
        // Create OneTap widget instance
        const oneTap = new VKID.OneTap();

        console.log('Creating VK ID OneTap widget');

        // Set up event handlers and render widget
        oneTap
          .render({ 
            container, 
            showAlternativeLogin: true 
          })
          .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
            console.error('VK ID OneTap error:', error);
            const errorObj = error as VKIDError;
            
            let errorMessage = 'Ошибка авторизации VK ID';
            if (errorObj.message) {
              errorMessage = errorObj.message;
            }
            
            // Provide helpful error messages
            if (errorObj.type === 'domain_error' || errorMessage.includes('domain')) {
              errorMessage = `Ошибка домена: Текущий домен не добавлен в настройки VK приложения.\n\nДля исправления:\n1. Откройте id.vk.com\n2. Перейдите в ваше приложение\n3. Добавьте ${window.location.origin} в доверенные домены`;
            }
            
            reject(new Error(errorMessage));
          })
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: unknown) => {
            try {
              console.log('VK ID authentication successful, payload:', payload);
              const loginPayload = payload as VKIDLoginPayload;
              
              if (!loginPayload.code || !loginPayload.device_id) {
                throw new Error('Некорректные данные авторизации: отсутствует код или device_id');
              }

              // Exchange authorization code for access token
              const result = await VKID.Auth.exchangeCode(
                loginPayload.code, 
                loginPayload.device_id
              );
              
              console.log('VK ID token exchange successful');
              
              resolve({
                accessToken: result.access_token,
                expiresIn: result.expires_in,
                userId: result.user_id
              });
            } catch (error) {
              console.error('VK ID token exchange error:', error);
              reject(new Error(`Ошибка обмена токена: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`));
            }
          });
      } catch (error) {
        console.error('VK ID OneTap widget creation error:', error);
        reject(new Error(`Ошибка создания виджета VK ID: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`));
      }
    });
  }

  /**
   * Open VK ID authentication in popup window (alternative method)
   */
  async authenticateWithPopup(): Promise<{ accessToken: string; expiresIn: number; userId: number }> {
    if (!this.isInitialized) {
      throw new Error('VK ID SDK не инициализирован. Вызовите initializeSDK() сначала.');
    }

    try {
      console.log('Starting VK ID popup authentication');
      const result = await VKID.Auth.login();
      
      console.log('VK ID popup authentication successful');
      
      const authResult = result as { access_token: string; expires_in: number; user_id: number };
      
      return {
        accessToken: authResult.access_token,
        expiresIn: authResult.expires_in,
        userId: authResult.user_id
      };
    } catch (error) {
      console.error('VK ID popup authentication error:', error);
      throw new Error(`Ошибка всплывающей авторизации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Reset SDK state (useful for testing or switching apps)
   */
  reset(): void {
    this.isInitialized = false;
    this.currentConfig = null;
    console.log('VK ID SDK state reset');
  }
}

export const vkidService = new VKIDService();
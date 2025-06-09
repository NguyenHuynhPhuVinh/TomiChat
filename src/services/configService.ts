import * as vscode from 'vscode';

/**
 * Service quản lý cấu hình cho TomiChat
 */
export class ConfigService {
  private static instance: ConfigService;
  private readonly configSection = 'tomiChat';

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Lấy cấu hình hiện tại
   */
  private getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(this.configSection);
  }

  /**
   * Lấy API Key từ cấu hình hoặc biến môi trường
   */
  public getApiKey(): string | undefined {
    const config = this.getConfig();
    const configApiKey = config.get<string>('apiKey');
    
    // Ưu tiên API key từ cấu hình, sau đó từ biến môi trường
    if (configApiKey && configApiKey.trim()) {
      return configApiKey.trim();
    }
    
    return (
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY
    );
  }

  /**
   * Thiết lập API Key
   */
  public async setApiKey(apiKey: string): Promise<void> {
    const config = this.getConfig();
    await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
  }

  /**
   * Xóa API Key
   */
  public async clearApiKey(): Promise<void> {
    const config = this.getConfig();
    await config.update('apiKey', '', vscode.ConfigurationTarget.Global);
  }

  /**
   * Lấy model được cấu hình
   */
  public getModel(): string {
    const config = this.getConfig();
    return config.get<string>('model', 'gemini-2.0-flash');
  }

  /**
   * Thiết lập model
   */
  public async setModel(model: string): Promise<void> {
    const config = this.getConfig();
    await config.update('model', model, vscode.ConfigurationTarget.Global);
  }

  /**
   * Kiểm tra xem streaming có được bật không
   */
  public isStreamingEnabled(): boolean {
    const config = this.getConfig();
    return config.get<boolean>('enableStreaming', true);
  }

  /**
   * Thiết lập streaming
   */
  public async setStreamingEnabled(enabled: boolean): Promise<void> {
    const config = this.getConfig();
    await config.update('enableStreaming', enabled, vscode.ConfigurationTarget.Global);
  }

  /**
   * Lấy số token tối đa
   */
  public getMaxTokens(): number {
    const config = this.getConfig();
    return config.get<number>('maxTokens', 1000);
  }

  /**
   * Thiết lập số token tối đa
   */
  public async setMaxTokens(maxTokens: number): Promise<void> {
    const config = this.getConfig();
    await config.update('maxTokens', maxTokens, vscode.ConfigurationTarget.Global);
  }

  /**
   * Lấy temperature
   */
  public getTemperature(): number {
    const config = this.getConfig();
    return config.get<number>('temperature', 0.8);
  }

  /**
   * Thiết lập temperature
   */
  public async setTemperature(temperature: number): Promise<void> {
    const config = this.getConfig();
    await config.update('temperature', temperature, vscode.ConfigurationTarget.Global);
  }

  /**
   * Kiểm tra xem cấu hình có hợp lệ không
   */
  public isConfigValid(): boolean {
    const apiKey = this.getApiKey();
    return !!(apiKey && apiKey.trim());
  }

  /**
   * Lấy tất cả cấu hình
   */
  public getAllConfig() {
    return {
      apiKey: this.getApiKey(),
      model: this.getModel(),
      enableStreaming: this.isStreamingEnabled(),
      maxTokens: this.getMaxTokens(),
      temperature: this.getTemperature(),
      isValid: this.isConfigValid(),
    };
  }

  /**
   * Hiển thị dialog thiết lập API Key
   */
  public async showApiKeySetupDialog(): Promise<boolean> {
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Nhập Google AI API Key của bạn',
      placeHolder: 'Ví dụ: AIzaSyC...',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'API Key không được để trống';
        }
        if (value.trim().length < 20) {
          return 'API Key có vẻ quá ngắn';
        }
        if (!value.startsWith('AIza')) {
          return 'Google AI API Key thường bắt đầu bằng "AIza"';
        }
        return null;
      },
    });

    if (apiKey) {
      await this.setApiKey(apiKey.trim());
      vscode.window.showInformationMessage('✅ API Key đã được thiết lập thành công!');
      return true;
    }

    return false;
  }

  /**
   * Hiển thị dialog xác nhận xóa API Key
   */
  public async showClearApiKeyDialog(): Promise<boolean> {
    const choice = await vscode.window.showWarningMessage(
      'Bạn có chắc chắn muốn xóa API Key?',
      { modal: true },
      'Xóa',
      'Hủy'
    );

    if (choice === 'Xóa') {
      await this.clearApiKey();
      vscode.window.showInformationMessage('🗑️ API Key đã được xóa');
      return true;
    }

    return false;
  }

  /**
   * Hiển thị hướng dẫn lấy API Key
   */
  public showApiKeyGuide(): void {
    const message = `
🔑 Hướng dẫn lấy Google AI API Key:

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google
3. Click "Create API Key"
4. Copy API Key và paste vào TomiChat

💡 Lưu ý:
- API Key miễn phí có giới hạn sử dụng
- Không chia sẻ API Key với người khác
- API Key được lưu an toàn trong VS Code settings
    `;

    vscode.window.showInformationMessage(
      'Hướng dẫn lấy API Key',
      'Mở trang web',
      'Đóng'
    ).then((choice) => {
      if (choice === 'Mở trang web') {
        vscode.env.openExternal(vscode.Uri.parse('https://makersuite.google.com/app/apikey'));
      }
    });
  }

  /**
   * Lắng nghe thay đổi cấu hình
   */
  public onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configSection)) {
        callback();
      }
    });
  }
}

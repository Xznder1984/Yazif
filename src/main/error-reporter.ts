import { shell } from 'electron';

export class ErrorReporter {
  private static readonly RECIPIENT = 'xander.razeralbarr@gmail.com';

  static sendReport(errorName: string, reason: string): { sent: boolean; url: string } {
    const subject = encodeURIComponent(`Yazif Error Report: ${errorName}`);
    const body = encodeURIComponent(
      `=== Yazif Error Report ===\n\n` +
      `Error: ${errorName}\n` +
      `Reason: ${reason || '(not provided)'}\n\n` +
      `---\n` +
      `OS: ${process.platform} ${process.arch}\n` +
      `Node: ${process.version}\n` +
      `App Version: 1.0.0\n` +
      `Timestamp: ${new Date().toISOString()}\n`
    );

    const url = `mailto:${this.RECIPIENT}?subject=${subject}&body=${body}`;
    shell.openExternal(url);

    return { sent: true, url };
  }
}

# Add the required assembly reference
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create a custom form class for clipboard monitoring
$source = @"
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class ClipboardMonitorForm : Form {
    private IntPtr nextWindow;
    
    [DllImport("user32.dll")]
    private static extern IntPtr SetClipboardViewer(IntPtr hWndNewViewer);

    [DllImport("user32.dll")]
    private static extern bool ChangeClipboardChain(IntPtr hWndRemove, IntPtr hWndNewNext);

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);

    private const int WM_DRAWCLIPBOARD = 0x0308;
    private const int WM_CHANGECBCHAIN = 0x030D;

    public ClipboardMonitorForm() {
        this.Visible = false;
        this.ShowInTaskbar = false;
        this.WindowState = FormWindowState.Minimized;
        nextWindow = SetClipboardViewer(this.Handle);
    }

    protected override void WndProc(ref Message m) {
        switch (m.Msg) {
            case WM_DRAWCLIPBOARD:
                try {
                    string text = Clipboard.GetText();
                    if (!string.IsNullOrEmpty(text)) {
                        Console.WriteLine(text);
                    }
                } catch (Exception ex) {
                    Console.Error.WriteLine("ERROR:" + ex.Message);
                }
                SendMessage(nextWindow, m.Msg, m.WParam, m.LParam);
                break;

            case WM_CHANGECBCHAIN:
                if (m.WParam == nextWindow) {
                    nextWindow = m.LParam;
                } else {
                    SendMessage(nextWindow, m.Msg, m.WParam, m.LParam);
                }
                break;

            default:
                base.WndProc(ref m);
                break;
        }
    }

    protected override void OnFormClosed(FormClosedEventArgs e) {
        ChangeClipboardChain(this.Handle, nextWindow);
        base.OnFormClosed(e);
    }
}
"@

# Compile the custom form class
Add-Type -TypeDefinition $source -ReferencedAssemblies System.Windows.Forms, System.Drawing

# Create and show the form
$form = New-Object ClipboardMonitorForm

# Show the form
[System.Windows.Forms.Application]::Run($form) 
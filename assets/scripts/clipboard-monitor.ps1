Add-Type -AssemblyName System.Windows.Forms

$source = @"
using System;
using System.Windows.Forms;
using System.Runtime.InteropServices;

public class ClipboardWatcher : Form
{
    private const int WM_CLIPBOARDUPDATE = 0x031D;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool AddClipboardFormatListener(IntPtr hwnd);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool RemoveClipboardFormatListener(IntPtr hwnd);

    public ClipboardWatcher()
    {
        this.Visible = false;
        this.ShowInTaskbar = false;
        this.WindowState = FormWindowState.Minimized;
        AddClipboardFormatListener(this.Handle);
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_CLIPBOARDUPDATE)
        {
            try {
                IDataObject iData = Clipboard.GetDataObject();
                if (iData != null && iData.GetDataPresent(DataFormats.Text))
                {
                    string text = (string)iData.GetData(DataFormats.Text);
                    if (!string.IsNullOrEmpty(text))
                    {
                        Console.WriteLine("CLIPBOARD_UPDATE:" + text);
                    }
                }
            } catch (Exception ex) {
                Console.WriteLine("ERROR:" + ex.Message);
            }
        }
        base.WndProc(ref m);
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        RemoveClipboardFormatListener(this.Handle);
        base.OnFormClosed(e);
    }
}
"@

Add-Type -TypeDefinition $source -ReferencedAssemblies System.Windows.Forms

$watcher = New-Object ClipboardWatcher
[System.Windows.Forms.Application]::Run($watcher) 